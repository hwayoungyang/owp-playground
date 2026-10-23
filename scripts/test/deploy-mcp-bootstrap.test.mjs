import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, lstat, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { bootstrapMcpRemote, discardMcpBootstrap, mcpRuntimeForPlan, probeMcpRemote } from '../deploy-mcp-bootstrap.mjs';
import { prepareMcpBundle } from '../deploy-mcp-bundle.mjs';
import { MCP_DEPENDENCIES_FILE, packMcpDependencies } from '../deploy-mcp-offline-format.mjs';
import { installMcpOfflineDependencies } from '../deploy-mcp-remote.mjs';
import { inspectMcpRuntime, inspectMcpServer } from '../deploy-mcp-preflight.mjs';
import { sha256 } from '../deploy-mcp-tar.mjs';
import { mcpFixture, systemShim } from './deploy-mcp-fixture.mjs';
import { mcpDeploymentConfig, shellQuote } from '../deploy-mcp-config.mjs';

const execute = promisify(execFile);
const nodeStub = '#!/bin/sh\nprintf "v24.22.1\\n"\n';
const pnpmStub = '#!/bin/sh\nprintf "12.15.0\\n"\n';
const entry = (bytes) => ({ bytes: bytes.length, sha256: sha256(bytes) });
async function scenario(t, options = {}) {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const modules = path.join(fixture.root, 'modules');
  await mkdir(path.join(modules, 'sample'), { recursive: true });
  await writeFile(path.join(modules, 'sample/index.js'), 'export const value = 42;');
  const files = {
    'runtime-node': Buffer.from(options.node ?? nodeStub),
    'runtime-pnpm': Buffer.from(pnpmStub),
    [MCP_DEPENDENCIES_FILE]: await packMcpDependencies(modules),
  };
  const manifest = {
    schemaVersion: 1, target: 'linux-x64-glibc', head: bundle.metadata.head, releaseId: bundle.metadata.releaseId,
    sourceSha256: bundle.metadata.files['app.tar.gz'].sha256,
    packageSha256: sha256(await readFile(path.join(bundle.directory, 'app/package.json'))),
    lockSha256: sha256(await readFile(path.join(bundle.directory, 'app/pnpm-lock.yaml'))),
    nodeVersion: '24.22.1', pnpmVersion: '12.15.0', nodeLinker: 'hoisted',
    files: Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, entry(bytes)])),
  };
  files['offline.json'] = Buffer.from(JSON.stringify(manifest));
  for (const [name, bytes] of Object.entries(files)) await writeFile(path.join(bundle.directory, name), bytes);
  const plan = { config: fixture.config, owner: '11111111-1111-4111-8111-111111111111', metadata: bundle.metadata, offline: manifest };
  const bin = path.join(fixture.root, 'bin');
  await mkdir(bin);
  for (const command of ['sh', 'sha256sum', 'mkdir', 'chmod', 'rm', 'rmdir', 'cat', 'wc', 'env']) {
    const actual = (await execute('/bin/sh', ['-c', `command -v ${command}`], { encoding: 'utf8' })).stdout.trim();
    await symlink(actual, path.join(bin, command));
  }
  const scripts = {
    id: '#!/bin/sh\nprintf "0\\n"\n',
    uname: '#!/bin/sh\nif [ "$1" = "-s" ]; then printf "Linux\\n"; else printf "x86_64\\n"; fi\n',
    getconf: '#!/bin/sh\nprintf "glibc 2.34\\n"\n',
    systemctl: '#!/bin/sh\nexit 0\n', ss: '#!/bin/sh\nexit 0\n',
    mv: `#!${process.execPath}\nimport{lstat,rename}from'node:fs/promises';const args=process.argv.slice(2).filter(x=>!['-Tn','--'].includes(x));try{await lstat(args[1]);}catch(e){if(e.code!=='ENOENT')throw e;await rename(args[0],args[1]);}\n`,
  };
  const selinuxStatePath = path.join(fixture.root, 'selinux-state.json');
  if (options.selinuxMode) {
    // 실제 SELinux 커널 대신 명령 호출과 rename 시 보존되는 파일 컨텍스트만 검증한다.
    await writeFile(selinuxStatePath, JSON.stringify({ mode: options.selinuxMode, calls: [], labelled: [] }));
    const stateSource = `import{readFile,writeFile,lstat,readdir}from'node:fs/promises';const file=${JSON.stringify(selinuxStatePath)};const s=JSON.parse(await readFile(file));const args=process.argv.slice(2);`;
    scripts.getenforce = `#!/bin/sh\nprintf '%s\\n' ${shellQuote(options.selinuxMode)}\n`;
    scripts.matchpathcon = `#!${process.execPath}\n${stateSource}s.calls.push(['matchpathcon',...args]);await writeFile(file,JSON.stringify(s));process.stdout.write('system_u:object_r:${options.policyType ?? 'bin_t'}:s0\\n');\n`;
    scripts.restorecon = `#!${process.execPath}\n${stateSource}s.calls.push(['restorecon',...args]);const targets=args.filter(x=>!x.startsWith('-'));if(${JSON.stringify(options.restoreconFailure ?? '')}&&targets.some(x=>x.includes(${JSON.stringify(options.restoreconFailure ?? '')}))){if(${Boolean(options.foreignOwnerOnRestoreFailure)})await writeFile(${JSON.stringify(`${plan.config.remoteRoot}/.deploy.lock/owner`)},'foreign');await writeFile(file,JSON.stringify(s));process.stderr.write('restorecon simulated failure\\n');process.exit(1)}async function mark(p){const st=await lstat(p);s.labelled.push(p);if(st.isDirectory()&&args.includes('-RF'))for(const n of await readdir(p))await mark(p+'/'+n)}for(const p of targets)await mark(p);await writeFile(file,JSON.stringify(s));\n`;
    scripts.systemctl = `#!${process.execPath}\n${stateSource}if(args[0]==='start'&&s.mode==='Enforcing'&&!s.labelled.includes(args[1])){process.stderr.write('status=203/EXEC simulated init_t execute denial\\n');process.exit(203)}\n`;
    scripts.mv = `#!${process.execPath}\n${stateSource}const{rename}=await import('node:fs/promises');const paths=args.filter(x=>!['-Tn','--'].includes(x));try{await lstat(paths[1])}catch(e){if(e.code!=='ENOENT')throw e;await rename(paths[0],paths[1]);s.labelled=s.labelled.map(p=>p===paths[0]||p.startsWith(paths[0]+'/')?paths[1]+p.slice(paths[0].length):p);await writeFile(file,JSON.stringify(s))}\n`;
    for (const name of options.missingSelinuxCommands ?? []) delete scripts[name];
  }
  for (const [name, source] of Object.entries(scripts)) await writeFile(path.join(bin, name), source, { mode: 0o755 });
  const calls = [];
  const execution = { interactive: false, run: async (command, args) => {
    calls.push(command);
    if (command === 'ssh') {
      const failurePath = options.failOwner === 'lock' ? `${plan.config.remoteRoot}/.deploy.lock` : options.failOwner === 'incoming' ? `${plan.config.remoteRoot}/.incoming-${plan.owner}` : `${plan.config.remoteRoot}/runtime/.stage-${plan.owner}`;
      const injected = options.failOwner ? `printf() { if [ "$1" = '%s' ] && [ "$2" = ${shellQuote(plan.owner)} ] && [ -d ${shellQuote(failurePath)} ]; then command printf partial; return 1; fi; command printf "$@"; }\n` : '';
      return (await execute('/bin/sh', ['-c', injected + args.at(-1)], { encoding: 'utf8', env: { ...process.env, PATH: bin }, timeout: 15000 })).stdout;
    }
    assert.equal(command, 'scp');
    if (options.transferFail) throw new Error('local transfer failure');
    const incoming = `${plan.config.remoteRoot}/.incoming-${plan.owner}`;
    for (const name of ['runtime-node', 'runtime-pnpm']) {
      await cp(path.join(bundle.directory, name), path.join(incoming, name));
      if (options.tamper && name === 'runtime-node') await writeFile(path.join(incoming, name), 'tampered');
    }
  } };
  const selinux = {
    state: async () => JSON.parse(await readFile(selinuxStatePath, 'utf8')),
    clear: async () => {
      const state = JSON.parse(await readFile(selinuxStatePath, 'utf8'));
      await writeFile(selinuxStatePath, JSON.stringify({ ...state, calls: [], labelled: [] }));
    },
    start: (node) => execute(path.join(bin, 'systemctl'), ['start', node], { encoding: 'utf8' }),
  };
  return { fixture, bundle, plan, execution, calls, selinux };
}
test('Given the default server policy, When planning the private runtime, Then the root is under opt and executable files are in bin', async (t) => {
  const { plan } = await scenario(t);
  assert.equal(mcpDeploymentConfig.remoteRoot, '/opt/owp-playground-mcp');
  const runtime = mcpRuntimeForPlan(plan);
  assert.equal(runtime.node, `${runtime.directory}/bin/node`);
  assert.equal(runtime.packageManager.command, `${runtime.directory}/bin/pnpm`);
});
for (const selinuxMode of ['Enforcing', 'Permissive']) test(`Given SELinux ${selinuxMode}, When a read-only probe checks a missing runtime, Then it queries policy without applying contexts or creating files`, async (t) => {
  const { plan, execution, selinux } = await scenario(t, { selinuxMode });
  assert.deepEqual(await probeMcpRemote(plan, execution), { runtimePending: true });
  const state = await selinux.state();
  assert.ok(state.calls.some(([command]) => command === 'matchpathcon'));
  assert.ok(state.calls.every(([command]) => command !== 'restorecon'));
  assert.deepEqual(state.labelled, []);
  await assert.rejects(lstat(plan.config.remoteRoot), { code: 'ENOENT' });
});
test('Given SELinux Disabled without context tools, When bootstrap runs, Then it installs the private runtime without querying or changing policy', async (t) => {
  const { plan, bundle, execution, selinux } = await scenario(t, { selinuxMode: 'Disabled', missingSelinuxCommands: ['restorecon', 'matchpathcon'] });
  await bootstrapMcpRemote(plan, bundle, execution);
  assert.equal(await readFile(plan.runtime.node, 'utf8'), nodeStub);
  assert.deepEqual((await selinux.state()).calls, []);
});
test('Given SELinux Enforcing and a private runtime with inherited contexts, When bootstrap installs or reuses it, Then the service execution shim succeeds only after default contexts are applied', async (t) => {
  const { plan, bundle, execution, selinux } = await scenario(t, { selinuxMode: 'Enforcing' });
  await bootstrapMcpRemote(plan, bundle, execution);
  await selinux.start(plan.runtime.node);
  const before = await lstat(plan.runtime.node);
  await discardMcpBootstrap(plan, execution);
  await selinux.clear();
  assert.equal((await execute(plan.runtime.node, ['--version'], { encoding: 'utf8' })).stdout.trim(), 'v24.22.1');
  await assert.rejects(selinux.start(plan.runtime.node), { code: 203, stderr: /203\/EXEC/ });
  assert.equal((await probeMcpRemote(plan, execution)).runtimePending, false);
  assert.ok((await selinux.state()).calls.every(([command]) => command !== 'restorecon'));
  await bootstrapMcpRemote(plan, bundle, execution);
  await selinux.start(plan.runtime.node);
  assert.equal((await lstat(plan.runtime.node)).ino, before.ino);
  assert.ok((await selinux.state()).calls.some(([command, , , target]) => command === 'restorecon' && target === plan.runtime.directory));
});
for (const command of ['restorecon', 'matchpathcon']) test(`Given SELinux Enforcing without ${command}, When a read-only probe runs, Then it rejects the server before creating the deployment root`, async (t) => {
  const { plan, execution } = await scenario(t, { selinuxMode: 'Enforcing', missingSelinuxCommands: [command] });
  await assert.rejects(probeMcpRemote(plan, execution), { stderr: new RegExp(command) });
  await assert.rejects(lstat(plan.config.remoteRoot), { code: 'ENOENT' });
});
test('Given a policy that maps the runtime binary to user_home_t, When bootstrap is requested, Then it rejects that path without changing files or contexts', async (t) => {
  const { plan, bundle, execution, selinux } = await scenario(t, { selinuxMode: 'Enforcing', policyType: 'user_home_t' });
  await assert.rejects(bootstrapMcpRemote(plan, bundle, execution), { stderr: /bin_t/ });
  assert.ok((await selinux.state()).calls.every(([command]) => command !== 'restorecon'));
  await assert.rejects(lstat(plan.config.remoteRoot), { code: 'ENOENT' });
});
for (const restoreconFailure of ['.incoming-', '.stage-']) test(`Given restorecon fails for ${restoreconFailure}, When bootstrap fails, Then it removes only this owner's incoming lock and unpublished stage`, async (t) => {
  const { plan, bundle, execution, selinux } = await scenario(t, { selinuxMode: 'Enforcing', restoreconFailure });
  await assert.rejects(bootstrapMcpRemote(plan, bundle, execution), { stderr: /restorecon/ });
  for (const directory of ['.deploy.lock', `.incoming-${plan.owner}`, `runtime/.stage-${plan.owner}`]) await assert.rejects(lstat(`${plan.config.remoteRoot}/${directory}`), { code: 'ENOENT' });
  await assert.rejects(lstat(mcpRuntimeForPlan(plan).directory), { code: 'ENOENT' });
  assert.ok((await selinux.state()).calls.filter(([command]) => command === 'restorecon').every(([, , , target]) => target.startsWith(`${plan.config.remoteRoot}/`) || target === plan.config.remoteRoot));
});
test('Given a foreign lock owner after restorecon fails, When cleanup runs, Then the foreign lock and staged files are preserved', async (t) => {
  const { plan, bundle, execution } = await scenario(t, { selinuxMode: 'Enforcing', restoreconFailure: '.stage-', foreignOwnerOnRestoreFailure: true });
  await assert.rejects(bootstrapMcpRemote(plan, bundle, execution), /정리/);
  assert.equal(await readFile(`${plan.config.remoteRoot}/.deploy.lock/owner`, 'utf8'), 'foreign');
  assert.equal(await readFile(`${plan.config.remoteRoot}/.incoming-${plan.owner}/runtime-node`, 'utf8'), nodeStub);
  assert.equal(await readFile(`${plan.config.remoteRoot}/runtime/.stage-${plan.owner}/owner`, 'utf8'), plan.owner);
});
for (const file of ['bin/node', 'receipt']) test(`Given a cached runtime with changed ${file}, When bootstrap is requested, Then it preserves the runtime without relabelling it`, async (t) => {
  const { plan, bundle, execution, selinux } = await scenario(t, { selinuxMode: 'Enforcing' });
  await bootstrapMcpRemote(plan, bundle, execution);
  await discardMcpBootstrap(plan, execution);
  await selinux.clear();
  const changed = `${plan.runtime.directory}/${file}`;
  await writeFile(changed, 'changed bytes');
  await assert.rejects(bootstrapMcpRemote(plan, bundle, execution));
  assert.equal(await readFile(changed, 'utf8'), 'changed bytes');
  assert.ok((await selinux.state()).calls.every(([command]) => command !== 'restorecon'));
});
test('Given a cached runtime whose bin directory is a symlink, When bootstrap is requested, Then it leaves the target and its contexts untouched', async (t) => {
  const { fixture, plan, bundle, execution, selinux } = await scenario(t, { selinuxMode: 'Enforcing' });
  await bootstrapMcpRemote(plan, bundle, execution);
  await discardMcpBootstrap(plan, execution);
  await selinux.clear();
  const outside = path.join(fixture.root, 'outside-bin');
  await mkdir(outside);
  await rm(`${plan.runtime.directory}/bin`, { recursive: true, force: true });
  await symlink(outside, `${plan.runtime.directory}/bin`);
  await assert.rejects(bootstrapMcpRemote(plan, bundle, execution));
  assert.deepEqual(await readdir(outside), []);
  assert.ok((await selinux.state()).calls.every(([command]) => command !== 'restorecon'));
});
test('Given no global Node or pnpm, When a read-only probe runs, Then it reports pending runtime without creating the deployment root', async (t) => {
  const { fixture, plan, execution, calls } = await scenario(t);
  assert.deepEqual(await probeMcpRemote(plan, execution), { runtimePending: true });
  await assert.rejects(lstat(fixture.config.remoteRoot), { code: 'ENOENT' });
  assert.deepEqual(calls, ['ssh']);
});
test('Given only base commands and transferred version shims, When bootstrap runs, Then it installs a private runtime and retains an owned incoming lock', async (t) => {
  const { plan, bundle, execution } = await scenario(t);
  const result = await bootstrapMcpRemote(plan, bundle, execution);
  assert.equal(result.runtimePending, false);
  assert.equal(await readFile(plan.runtime.node, 'utf8'), nodeStub);
  assert.ok((await lstat(plan.runtime.node)).mode & 0o111);
  assert.equal(await readFile(`${plan.config.remoteRoot}/.deploy.lock/owner`, 'utf8'), plan.owner);
  assert.ok(plan.runtime.node.startsWith(`${plan.config.remoteRoot}/runtime/`));
});
test('Given an installed private runtime, When a later bootstrap runs, Then the same verified runtime is reused', async (t) => {
  const { plan, bundle, execution } = await scenario(t);
  await bootstrapMcpRemote(plan, bundle, execution);
  const before = await lstat(plan.runtime.node);
  await discardMcpBootstrap(plan, execution);
  assert.equal((await probeMcpRemote(plan, execution)).runtimePending, false);
  await bootstrapMcpRemote(plan, bundle, execution);
  assert.equal((await lstat(plan.runtime.node)).ino, before.ino);
});
test('Given a foreign deployment lock, When bootstrap runs, Then the foreign owner and files remain unchanged', async (t) => {
  const { plan, bundle, execution } = await scenario(t);
  await mkdir(`${plan.config.remoteRoot}/.deploy.lock`, { recursive: true });
  await writeFile(`${plan.config.remoteRoot}/.deploy.lock/owner`, 'foreign');
  await assert.rejects(bootstrapMcpRemote(plan, bundle, execution));
  assert.equal(await readFile(`${plan.config.remoteRoot}/.deploy.lock/owner`, 'utf8'), 'foreign');
});
for (const [name, options] of [['tampered runtime', { tamper: true }], ['failed version check', { node: '#!/bin/sh\nprintf "v25.0.0\\n"\n' }], ['failed transfer', { transferFail: true }]]) {
  test(`Given ${name}, When bootstrap fails, Then only this attempt is cleaned and no runtime is published`, async (t) => {
    const { plan, bundle, execution } = await scenario(t, options);
    await assert.rejects(bootstrapMcpRemote(plan, bundle, execution));
    await assert.rejects(lstat(`${plan.config.remoteRoot}/.deploy.lock`), { code: 'ENOENT' });
    await assert.rejects(lstat(`${plan.config.remoteRoot}/.incoming-${plan.owner}`), { code: 'ENOENT' });
    await assert.rejects(lstat(mcpRuntimeForPlan(plan).directory), { code: 'ENOENT' });
  });
}
test('Given a symlink deployment ancestor, When the read-only probe runs, Then it refuses the path and leaves its target empty', async (t) => {
  const { fixture, plan, execution } = await scenario(t);
  const outside = path.join(fixture.root, 'outside');
  await mkdir(outside);
  await symlink(outside, plan.config.remoteRoot);
  await assert.rejects(probeMcpRemote(plan, execution));
  assert.deepEqual(await readdir(outside), []);
});
test('Given ownership changed after bootstrap, When cleanup runs, Then it preserves both the incoming files and foreign lock', async (t) => {
  const { plan, bundle, execution } = await scenario(t);
  await bootstrapMcpRemote(plan, bundle, execution);
  await writeFile(`${plan.config.remoteRoot}/.deploy.lock/owner`, 'foreign');
  await assert.rejects(discardMcpBootstrap(plan, execution));
  assert.equal(await readFile(`${plan.config.remoteRoot}/.deploy.lock/owner`, 'utf8'), 'foreign');
  assert.equal(await readFile(`${plan.config.remoteRoot}/.incoming-${plan.owner}/runtime-node`, 'utf8'), nodeStub);
});
test('Given a source-bound dependency artifact, When the server installs it, Then modules are materialized without executing a package manager', async (t) => {
  const { plan, bundle, execution } = await scenario(t);
  await bootstrapMcpRemote(plan, bundle, execution);
  const incoming = `${plan.config.remoteRoot}/.incoming-${plan.owner}`;
  for (const name of ['offline.json', MCP_DEPENDENCIES_FILE]) await cp(path.join(bundle.directory, name), path.join(incoming, name));
  await installMcpOfflineDependencies(path.join(bundle.directory, 'app'), { ...plan, incoming });
  assert.equal(await readFile(path.join(bundle.directory, 'app/node_modules/sample/index.js'), 'utf8'), 'export const value = 42;');
});
test('Given a lockfile changed after preparation, When server extraction is requested, Then it refuses the artifact before creating node_modules', async (t) => {
  const { plan, bundle, execution } = await scenario(t);
  await bootstrapMcpRemote(plan, bundle, execution);
  const incoming = `${plan.config.remoteRoot}/.incoming-${plan.owner}`;
  for (const name of ['offline.json', MCP_DEPENDENCIES_FILE]) await cp(path.join(bundle.directory, name), path.join(incoming, name));
  await writeFile(path.join(bundle.directory, 'app/pnpm-lock.yaml'), 'changed lockfile');
  await assert.rejects(installMcpOfflineDependencies(path.join(bundle.directory, 'app'), { ...plan, incoming }));
  await assert.rejects(lstat(path.join(bundle.directory, 'app/node_modules')), { code: 'ENOENT' });
});
test('Given a freshly bootstrapped private runtime, When full server inspection runs under its owner lock, Then it uses absolute runtime files and preserves service checks', async (t) => {
  const { fixture, plan, bundle, execution } = await scenario(t);
  await bootstrapMcpRemote(plan, bundle, execution);
  const shim = await systemShim(fixture);
  const run = async (command, args, options) => {
    if (command !== plan.runtime.packageManager.command) return shim.run(command, args, options);
    assert.equal(options.env.PATH, `${plan.runtime.directory}/bin:/usr/sbin:/usr/bin:/sbin:/bin`);
    return '12.15.0';
  };
  const result = await inspectMcpServer(plan.config, { ...shim.preflight, run, nodePath: plan.runtime.node, runtime: plan.runtime, lockOwner: plan.owner });
  assert.equal(result.node, plan.runtime.node);
  assert.equal(result.packageManager.command, plan.runtime.packageManager.command);
  assert.ok((await shim.state()).calls.some(([command]) => command === 'ss'));
});
test('Given a private runtime modified after bootstrap, When full runtime inspection runs, Then it rejects the changed file before package manager execution', async (t) => {
  const { plan, bundle, execution } = await scenario(t);
  await bootstrapMcpRemote(plan, bundle, execution);
  await writeFile(plan.runtime.node, 'tampered runtime');
  let calls = 0;
  await assert.rejects(inspectMcpRuntime(plan.config, plan.runtime, async () => { calls++; return '12.15.0'; }));
  assert.equal(calls, 0);
});
for (const failOwner of ['lock', 'incoming', 'stage']) test(`Given a partial ${failOwner} owner write, When bootstrap fails, Then this call's incomplete directories are removed`, async (t) => {
  const { plan, bundle, execution } = await scenario(t, { failOwner });
  await assert.rejects(bootstrapMcpRemote(plan, bundle, execution));
  await assert.rejects(lstat(`${plan.config.remoteRoot}/.deploy.lock`), { code: 'ENOENT' });
  await assert.rejects(lstat(`${plan.config.remoteRoot}/.incoming-${plan.owner}`), { code: 'ENOENT' });
  await assert.rejects(lstat(`${plan.config.remoteRoot}/runtime/.stage-${plan.owner}`), { code: 'ENOENT' });
});
