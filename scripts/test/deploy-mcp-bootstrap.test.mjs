import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, lstat, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
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
import { shellQuote } from '../deploy-mcp-config.mjs';

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
  return { fixture, bundle, plan, execution, calls };
}
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
  const run = async (command, args, options) => command === plan.runtime.packageManager.command ? '12.15.0' : shim.run(command, args, options);
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
