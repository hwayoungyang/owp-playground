import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { prepareMcpBundle } from '../deploy-mcp-bundle.mjs';
import { installMcpDependencies } from '../deploy-mcp-remote.mjs';
import { runMcpDeployment } from '../deploy-mcp.mjs';
import { operateMcpRemote, pinMcpHelpers, preflightMcpRemote, transferMcpBundle } from '../deploy-mcp-transport.mjs';
import { mcpFixture, stageMcpFixture } from './deploy-mcp-fixture.mjs';

const execute = promisify(execFile);
async function preflightShell(t, uid = '0') {
  const bin = await mkdtemp(path.join(tmpdir(), 'owp-mcp-preflight-shell-'));
  t.after(() => rm(bin, { recursive: true, force: true }));
  await writeFile(path.join(bin, 'id'), `#!/bin/sh\nprintf '%s\\n' '${uid}'\n`, { mode: 0o755 });
  const execution = { interactive: false, run: async (command, args) => {
    assert.equal(command, 'ssh');
    try {
      return (await execute('/bin/sh', ['-c', args.at(-1)], { encoding: 'utf8', env: { ...process.env, PATH: bin }, timeout: 10000 })).stdout;
    } catch (cause) {
      throw new Error(`ssh 실행에 실패했습니다 (${cause.code}).`, { cause });
    }
  } };
  return { bin, execution, config: { user: 'root', host: '127.0.0.1', sshPort: 22 } };
}
test('Given root with only id on PATH, When the generated preflight command runs in POSIX sh, Then missing Node explains the exact runtime and noninteractive SSH PATH preparation', async (t) => {
  const { config, execution } = await preflightShell(t);
  await assert.rejects(preflightMcpRemote(config, execution), (error) => {
    assert.match(error.message, /Node\.js 24\.22\.1/);
    assert.match(error.message, /비대화형 SSH.*PATH/);
    assert.match(error.message, /준비/);
    return true;
  });
});
test('Given a non-root shell without Node, When preflight runs, Then the root rejection remains an SSH failure', async (t) => {
  const { config, execution } = await preflightShell(t, '1000');
  await assert.rejects(preflightMcpRemote(config, execution), { message: 'ssh 실행에 실패했습니다 (1).' });
});
test('Given missing remote Node, When deployment reaches the real preflight, Then it closes the session before any remote changes or success log', async (t) => {
  const fixture = await mcpFixture(t);
  const { execution } = await preflightShell(t);
  const calls = [];
  const logs = [];
  const signals = new EventEmitter();
  const dependencies = {
    config: fixture.config, interactive: false, signals, log: (line) => logs.push(line),
    confirm: async () => {}, checkPort: async () => {},
    prepareOffline: async () => ({ manifest: { target: 'linux-x64-glibc', nodeVersion: '24.22.1', pnpmVersion: '12.15.0' }, transferFiles: [] }),
    probe: async (plan, session) => preflightMcpRemote(plan.config, session),
    connect: async () => ({ run: async (...args) => { calls.push('preflight'); return execution.run(...args); }, close: async () => calls.push('close') }),
    createIncoming: async () => calls.push('incoming'), transfer: async () => calls.push('transfer'),
    operate: async (operation) => calls.push(operation), verify: async () => calls.push('verify'),
  };
  await assert.rejects(runMcpDeployment({ bundle: fixture.bundle }, dependencies), /Node\.js 24\.22\.1/);
  assert.deepEqual(calls, ['preflight', 'close']);
  assert.equal(logs.some((line) => /사전 검사: OK|MCP 배포 완료/.test(line)), false);
  assert.equal(signals.listenerCount('SIGINT'), 0);
  assert.equal(signals.listenerCount('SIGTERM'), 0);
});
test('Given Node on PATH with an unsupported version, When the generated preflight runs, Then the existing runtime inspection executes and its failure propagates', async (t) => {
  const { bin, config, execution } = await preflightShell(t);
  await writeFile(path.join(bin, 'node'), `#!${process.execPath}\nObject.defineProperty(process, 'version', { value: 'v0.0.0' });\nconst source = process.argv[process.argv.indexOf('-e') + 1];\nprocess.argv = [process.execPath, process.argv.at(-1)];\nawait import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));\n`, { mode: 0o755 });
  await assert.rejects(preflightMcpRemote(config, execution), (error) => {
    assert.equal(error.message, 'ssh 실행에 실패했습니다 (1).');
    assert.match(error.cause.stderr, /서버 Node 24\.22\.1이 필요합니다/);
    return true;
  });
});
test('Given an SSH authentication or communication failure, When preflight runs, Then the original failure propagates without a missing Node diagnosis', async () => {
  for (const code of [127, 255]) {
    const failure = new Error(`ssh 실행에 실패했습니다 (${code}).`);
    await assert.rejects(preflightMcpRemote({ user: 'root', host: '127.0.0.1', sshPort: 22 }, { interactive: false, run: async () => { throw failure; } }), (error) => error === failure);
  }
});
test('Given a successful remote inspection, When preflight receives its result, Then the existing server result is preserved', async () => {
  const server = { node: '/usr/bin/node', packageManager: { command: 'pnpm', prefix: [], version: '12.15.0' } };
  const execution = { interactive: false, run: async () => `OWP_MCP_RESULT ${JSON.stringify(server)}\n` };
  assert.deepEqual(await preflightMcpRemote({ user: 'root', host: '127.0.0.1', sshPort: 22 }, execution), server);
});
test('Given pinned helper files, When the real generated control command runs through a local SSH shim, Then it verifies SHA before executing', async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const helpers = await pinMcpHelpers(bundle);
  bundle.transferFiles.push(...helpers);
  const plan = await stageMcpFixture(fixture, bundle);
  const calls = [];
  const execution = { interactive: false, run: async (command, args) => {
    calls.push({ command, args });
    assert.equal(command, 'ssh');
    return (await execute('/bin/sh', ['-c', args.at(-1)], { encoding: 'utf8', env: process.env })).stdout;
  } };
  assert.deepEqual(await operateMcpRemote('rollback', plan, execution), { rolledBack: true, changed: false });
  assert.ok(calls[0].args.includes('StrictHostKeyChecking=yes'));
  await writeFile(path.join(plan.incoming, 'deploy-mcp-unit.mjs'), 'tampered helper');
  await assert.rejects(operateMcpRemote('rollback', plan, execution));
  assert.equal(await readFile(path.join(plan.config.remoteRoot, '.deploy.lock/owner'), 'utf8'), plan.owner);
});
test('Given an explicit bundle, When SCP is planned, Then only frozen files and the fixed private incoming destination are passed', async (t) => {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const plan = { config: fixture.config, files: bundle.transferFiles, owner: '11111111-1111-4111-8111-111111111111' };
  let call;
  await transferMcpBundle(plan, bundle, { interactive: false, run: async (...args) => { call = args; } });
  assert.equal(call[0], 'scp');
  assert.ok(call[1].includes('StrictHostKeyChecking=yes'));
  assert.equal(call[1].at(-1), `root@127.0.0.1:${fixture.config.remoteRoot}/.incoming-${plan.owner}/`);
  assert.ok(bundle.transferFiles.every((file) => call[1].includes(path.join(bundle.directory, file.name))));
});
test('Given only a cached Corepack process shim on PATH, When dependencies install, Then prod, frozen lockfile and ignored lifecycle scripts are passed', async (t) => {
  const fixture = await mcpFixture(t);
  const bin = path.join(fixture.root, 'bin');
  await mkdir(bin);
  const output = path.join(fixture.root, 'corepack-call.json');
  const corepack = path.join(bin, 'corepack');
  await writeFile(corepack, `#!${process.execPath}\nimport{writeFileSync}from'node:fs';if(process.argv.at(-1)==='--version')process.stdout.write('12.15.0');else writeFileSync(${JSON.stringify(output)},JSON.stringify({args:process.argv.slice(2),cwd:process.cwd(),network:process.env.COREPACK_ENABLE_NETWORK}));`);
  await chmod(corepack, 0o755);
  const previous = process.env.PATH;
  process.env.PATH = bin;
  try { await installMcpDependencies(fixture.bundle); }
  finally { process.env.PATH = previous; }
  const call = JSON.parse(await readFile(output, 'utf8'));
  assert.deepEqual(call.args, ['pnpm@12.15.0', 'install', '--prod', '--frozen-lockfile', '--ignore-scripts', '--config.manage-package-manager-versions=false']);
  assert.equal(call.cwd, fixture.bundle);
  assert.equal(call.network, '0');
});
