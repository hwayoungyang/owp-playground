import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { promisify } from 'node:util';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseMcpDeployOptions, runMcpDeployment } from '../deploy-mcp.mjs';
import { validateMcpConfig } from '../deploy-mcp-config.mjs';
import { mcpFixture } from './deploy-mcp-fixture.mjs';

const execute = promisify(execFile);
const cli = fileURLToPath(new URL('../deploy-mcp.mjs', import.meta.url));
function scenario() {
  const calls = [];
  const run = async () => {};
  const signals = new EventEmitter();
  const runtime = { node: '/managed/runtime/node', packageManager: { command: '/managed/runtime/pnpm', prefix: [], version: '12.16.1' } };
  const dependencies = {
    signals, interactive: false, log() {}, owner: () => '11111111-1111-4111-8111-111111111111',
    confirm: async () => calls.push('confirm'), checkPort: async () => calls.push('port'),
    prepareOffline: async () => { calls.push('prepare-offline'); return { manifest: { target: 'linux-x64-glibc', nodeVersion: '24.22.1', pnpmVersion: '12.16.1' }, transferFiles: [] }; },
    connect: async () => { calls.push('connect'); return { run, close: async () => calls.push('close') }; },
    probe: async () => { calls.push('probe'); return { runtimePending: false, runtime }; },
    bootstrap: async (plan) => { calls.push('bootstrap'); plan.runtime = runtime; },
    prepareStorage: async () => [],
    maintain: async () => { calls.push('maintain'); return { cleanup: { warnings: [] } }; },
    preflight: async (_config, execution) => { assert.equal(execution.run, run); calls.push('preflight'); return {}; },
    transfer: async (_plan, _bundle, execution) => { assert.equal(execution.run, run); calls.push('transfer'); },
    operate: async (operation, plan, execution) => {
      assert.equal(execution.run, run); calls.push(operation);
      return { releaseId: plan.releaseId, head: plan.head, root: plan.config.remoteRoot, url: plan.config.url, owner: plan.owner };
    },
    verify: async () => { calls.push('verify'); return { http: true, mcp: true }; },
  };
  return { calls, dependencies, signals };
}
test('Given optional bundle options and pnpm forwarding, When parsed, Then omission and explicit overrides are preserved', () => {
  assert.equal(parseMcpDeployOptions(['--', '--bundle', '/private/tmp/input', '--dry-run']).dryRun, true);
  assert.equal(parseMcpDeployOptions([]).bundle, undefined);
  assert.equal(parseMcpDeployOptions(['--dry-run']).dryRun, true);
  assert.equal(parseMcpDeployOptions(['--bundle', 'input']).bundle, 'input');
  for (const empty of ['', '   ']) assert.throws(() => parseMcpDeployOptions(['--bundle', empty]), /--bundle/);
  assert.throws(() => parseMcpDeployOptions(['--bundle']), /argument/);
  assert.throws(() => parseMcpDeployOptions(['--bundle', 'input', '--dry-run', '--preflight-only']));
  assert.throws(() => parseMcpDeployOptions(['--bundle', 'input', '--host', 'evil']));
  for (const config of [{ remoteRoot: '/home/../etc' }, { service: 'foo;rm' }, { url: 'http://user:secret@192.168.100.20:30011' }, { remoteRoot: '/tmp/a b' }, { remoteRoot: '/etc/systemd/system' }]) assert.throws(() => validateMcpConfig(config));
});
test('Given --help, When the real CLI runs, Then no bundle or VPN is needed', async () => {
  const { stdout } = await execute(process.execPath, ['--experimental-strip-types', cli, '--help'], { cwd: '/private/tmp', timeout: 10000 });
  assert.match(stdout, /deploy:mcp/);
  assert.match(stdout, /30011/);
  assert.match(stdout, /\[--bundle DIR\]/);
  assert.match(stdout, /최신 clean stable/);
  assert.match(stdout, /24\.22\.1/);
  assert.match(stdout, /12\.16\.1/);
});
test('Given a prepared bundle, When dry-run is requested, Then no network dependency is called', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  const result = await runMcpDeployment({ bundle: fixture.bundle, dryRun: true }, dependencies);
  assert.equal(result.stage, 'dry-run');
  assert.ok(result.plan.files.some((file) => file.name === 'app.tar.gz'));
  assert.equal(result.plan.bundle, fixture.bundle);
  assert.deepEqual(calls, []);
});

test('prepared-only dry-run requires cached dependencies and never calls VPN, installer or SSH', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  dependencies.readPrepared = async () => undefined;
  await assert.rejects(runMcpDeployment({ bundle: fixture.bundle, dryRun: true, preparedOnly: true }, dependencies), /deploy:prepare/);
  assert.deepEqual(calls, []);
  dependencies.readPrepared = async () => ({ reused: true });
  const result = await runMcpDeployment({ bundle: fixture.bundle, dryRun: true, preparedOnly: true }, dependencies);
  assert.equal(result.plan.offline.stage, 'prepared');
  assert.equal(result.plan.offline.reused, true);
  assert.deepEqual(calls, []);
});
test('Given no explicit VPN confirmation, When noninteractive CLI runs, Then it stops before SSH', async (t) => {
  const fixture = await mcpFixture(t);
  await assert.rejects(execute(process.execPath, ['--experimental-strip-types', cli, '--bundle', fixture.bundle], { timeout: 10000 }), (error) => {
    assert.match(error.stderr, /비대화형 deploy:mcp/);
    assert.doesNotMatch(error.stdout, /서버 .* 사전 검사: OK/);
    return true;
  });
});
test('Given preflight-only, When executed, Then the shared connection closes without uploading or changing services', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  const result = await runMcpDeployment({ bundle: fixture.bundle, preflightOnly: true }, dependencies);
  assert.equal(result.stage, 'preflight-checked');
  assert.deepEqual(calls, ['confirm', 'prepare-offline', 'port', 'connect', 'probe', 'preflight', 'close']);
});
test('Given a server without the dedicated runtime, When preflight-only runs, Then it reports pending bootstrap without installing or claiming full inspection', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  dependencies.probe = async () => { calls.push('probe'); return { runtimePending: true }; };
  const result = await runMcpDeployment({ bundle: fixture.bundle, preflightOnly: true }, dependencies);
  assert.equal(result.stage, 'preflight-bootstrap-required');
  assert.deepEqual(calls, ['confirm', 'prepare-offline', 'port', 'connect', 'probe', 'close']);
});
test('Given cancellation during local artifact preparation, When preparation settles, Then no server connection or bootstrap starts', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies, signals } = scenario();
  const prepare = dependencies.prepareOffline;
  dependencies.prepareOffline = async (...args) => { const result = await prepare(...args); signals.emit('SIGINT'); return result; };
  await assert.rejects(runMcpDeployment({ bundle: fixture.bundle }, dependencies), /취소/);
  assert.deepEqual(calls, ['confirm', 'prepare-offline']);
  assert.equal(signals.listenerCount('SIGINT'), 0);
});
test('Given failed local dependency preparation, When deployment runs, Then it stops before accessing the server', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  dependencies.prepareOffline = async () => { throw new Error('local dependency preparation failed'); };
  await assert.rejects(runMcpDeployment({ bundle: fixture.bundle }, dependencies), /local dependency preparation failed/);
  assert.deepEqual(calls, ['confirm']);
});
test('Given a successful deployment, When all phases run, Then every phase shares one session and verification precedes commit', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  dependencies.verify = async (_config, _bundle, options) => {
    assert.equal(options?.log, dependencies.log);
    calls.push('verify');
    return { http: true, mcp: true };
  };
  assert.equal((await runMcpDeployment({ bundle: fixture.bundle }, dependencies)).stage, 'deployed');
  assert.deepEqual(calls, ['confirm', 'prepare-offline', 'port', 'connect', 'probe', 'bootstrap', 'preflight', 'maintain', 'transfer', 'activate', 'verify', 'commit', 'close']);
});
test('an uncertain commit response never rolls back a potentially committed deployment', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  const operate = dependencies.operate;
  dependencies.operate = async (...args) => {
    if (args[0] === 'commit') { calls.push('commit'); throw new Error('commit response lost'); }
    return operate(...args);
  };
  await assert.rejects(runMcpDeployment({ bundle: fixture.bundle }, dependencies), /commit.*확인|commit.*미확정/);
  assert.equal(calls.includes('rollback'), false);
});
test('terminal cleanup warnings preserve a successful deployment without rollback', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  const operate = dependencies.operate;
  dependencies.operate = async (...args) => ({ ...await operate(...args), ...(args[0] === 'commit' ? { cleanupWarnings: ['cleanup denied'] } : {}) });
  const deployed = await runMcpDeployment({ bundle: fixture.bundle }, dependencies);
  assert.equal(deployed.stage, 'deployed');
  assert.deepEqual(deployed.receipt.cleanupWarnings, ['cleanup denied']);
  assert.equal(calls.includes('rollback'), false);
});
test('an active legacy baseline is verified over HTTP and MCP before adoption and bulk transfer', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  const release = JSON.parse(await readFile(path.join(fixture.bundle, 'release.json')));
  const manifest = JSON.parse(await readFile(path.join(fixture.archiveRoot, `versions/${release.releaseId}/knowledge-release.json`)));
  const receipt = { appDirectory: '/managed/apps/current', releaseId: release.releaseId, head: release.head };
  dependencies.preflight = async () => { calls.push('preflight'); return { receipt, active: 'active', previousManifest: manifest }; };
  dependencies.verify = async (_config, selected) => { calls.push(selected.manifest ? 'verify-baseline' : 'verify-new'); };
  dependencies.maintain = async (plan) => { calls.push('maintain'); assert.deepEqual(plan.baselineVerified, receipt); return {}; };
  await runMcpDeployment({ bundle: fixture.bundle }, dependencies);
  assert.ok(calls.indexOf('verify-baseline') < calls.indexOf('maintain'));
  assert.ok(calls.indexOf('maintain') < calls.indexOf('transfer'));
});
for (const reason of ['HTTP stale HTML', 'MCP wrong release']) test(`Given ${reason}, When post-verification fails, Then rollback finalizes before the connection closes`, async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  dependencies.verify = async () => { calls.push('verify'); throw new Error(reason); };
  await assert.rejects(runMcpDeployment({ bundle: fixture.bundle }, dependencies), new RegExp(reason));
  assert.deepEqual(calls.slice(-4), ['verify', 'rollback', 'rollback-finalize', 'close']);
});
test('Given SIGINT during activation, When that phase settles, Then rollback uses the live shared session before closing', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies, signals } = scenario();
  const operate = dependencies.operate;
  dependencies.operate = async (...args) => { const response = await operate(...args); if (args[0] === 'activate') signals.emit('SIGINT'); return response; };
  await assert.rejects(runMcpDeployment({ bundle: fixture.bundle }, dependencies), /취소/);
  assert.deepEqual(calls.slice(-4), ['activate', 'rollback', 'rollback-finalize', 'close']);
  assert.equal(signals.listenerCount('SIGINT'), 0);
});
test('Given an SSH break during rollback, When deployment fails, Then it reports preserved recovery paths and closes the session', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  dependencies.verify = async () => { throw new Error('verify failed'); };
  const operate = dependencies.operate;
  dependencies.operate = async (...args) => { if (args[0] === 'rollback') throw new Error('shared connection lost'); return operate(...args); };
  await assert.rejects(runMcpDeployment({ bundle: fixture.bundle }, dependencies), /성공으로 처리하지 않았습니다.*\.deploy.lock/);
  assert.equal(calls.at(-1), 'close');
  assert.equal(calls.includes('commit'), false);
});

test('Given an intervening deployment after preflight, When rollback returns its actual baseline, Then that restored release is verified before unlocking', async (t) => {
  const fixture = await mcpFixture(t);
  const { calls, dependencies } = scenario();
  const release = JSON.parse(await readFile(path.join(fixture.bundle, 'release.json')));
  const manifest = JSON.parse(await readFile(path.join(fixture.archiveRoot, `versions/${release.releaseId}/knowledge-release.json`)));
  let verifies = 0;
  dependencies.verify = async (_config, selected, options) => {
    assert.equal(options?.log, dependencies.log);
    calls.push(verifies++ === 0 ? 'verify-new' : 'verify-restored');
    if (verifies === 1) throw new Error('new release invalid');
    assert.deepEqual(selected.manifest, manifest);
  };
  const operate = dependencies.operate;
  dependencies.operate = async (...args) => {
    const result = await operate(...args);
    return args[0] === 'rollback' ? { changed: true, baseline: { active: 'active', receipt: { releaseId: release.releaseId }, manifest } } : result;
  };
  await assert.rejects(runMcpDeployment({ bundle: fixture.bundle }, dependencies), /new release invalid/);
  assert.deepEqual(calls.slice(-5), ['verify-new', 'rollback', 'verify-restored', 'rollback-finalize', 'close']);
});
