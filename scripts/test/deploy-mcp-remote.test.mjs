import assert from 'node:assert/strict';
import { mkdir, readFile, readlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { sha256 } from '../deploy-mcp-tar.mjs';
import { prepareMcpBundle } from '../deploy-mcp-bundle.mjs';
import { inspectMcpServer } from '../deploy-mcp-preflight.mjs';
import { runMcpRemoteOperation } from '../deploy-mcp-remote.mjs';
import { directoryEntries, mcpFixture, stageMcpFixture, systemShim, tarBytes, writeFixtureMetadata, writeMcpFixtureBundle } from './deploy-mcp-fixture.mjs';

async function scenario(t) {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const shim = await systemShim(fixture);
  const plan = await stageMcpFixture(fixture, bundle);
  return { fixture, bundle, shim, plan };
}
test('Given an initial server, When activated and committed, Then exact receipt is returned and the lock is released', async (t) => {
  const { fixture, bundle, shim, plan } = await scenario(t);
  const activated = await runMcpRemoteOperation('activate', plan, shim);
  assert.equal(activated.releaseId, bundle.metadata.releaseId);
  assert.deepEqual(activated.packageManager, { command: 'pnpm', prefix: [], version: '12.15.0' });
  assert.equal(await readlink(path.join(fixture.config.remoteRoot, 'current')), activated.appDirectory);
  assert.equal((await shim.state()).active, 'active');
  assert.equal((await shim.state()).enabled, 'enabled');
  assert.equal(await readFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), 'utf8'), plan.owner);
  assert.deepEqual(await runMcpRemoteOperation('commit', plan, shim), activated);
  await assert.rejects(readFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner')), { code: 'ENOENT' });
});
test('Given a service that exits before becoming active, When activation fails, Then the error preserves systemd exit details while rolling back', async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  const run = shim.run;
  let justStarted = false;
  shim.run = async (command, args) => {
    if (command === 'systemctl' && args.filter((arg) => arg.startsWith('--property=')).length > 1) return 'ActiveState=failed\nSubState=failed\nResult=exit-code\nExecMainStatus=203';
    if (justStarted && args.includes('--property=ActiveState')) { justStarted = false; return 'failed'; }
    const result = await run(command, args);
    if (['start', 'restart'].includes(args[0])) justStarted = true;
    return result;
  };
  await assert.rejects(runMcpRemoteOperation('activate', plan, shim), /ExecMainStatus=203/);
  assert.equal((await shim.state()).active, 'inactive');
  await assert.rejects(readFile(path.join(fixture.config.unitDirectory, `${fixture.config.service}.service`)), { code: 'ENOENT' });
});
test('Given a cached preflight selection and changed server runtimes, When activation holds the lock, Then installation uses the fresh server selection', async (t) => {
  const { shim, plan } = await scenario(t);
  await shim.state({ pnpmPresent: false });
  const first = await inspectMcpServer(plan.config, { ...shim.preflight, lockOwner: plan.owner });
  assert.equal(first.packageManager.command, 'corepack');
  plan.packageManager = { command: '/untrusted/command', prefix: ['install'], version: '12.15.0' };
  plan.metadata.packageManager = first.packageManager;
  await shim.state({ pnpmPresent: true, corepackPresent: false });
  const install = shim.install;
  let selected;
  shim.install = async (directory, selection) => { selected = selection; await install(directory); };
  const activated = await runMcpRemoteOperation('activate', plan, shim);
  assert.deepEqual(selected, { command: 'pnpm', prefix: [], version: '12.15.0' });
  assert.deepEqual(activated.packageManager, selected);
  await runMcpRemoteOperation('commit', plan, shim);
});
test('Given a valid installed pnpm without Corepack, When server preflight runs, Then Corepack is never invoked', async (t) => {
  const fixture = await mcpFixture(t);
  const shim = await systemShim(fixture);
  await shim.state({ corepackPresent: false });
  assert.equal((await inspectMcpServer(fixture.config, shim.preflight)).packageManager.command, 'pnpm');
  assert.equal((await shim.state()).calls.some(([command]) => command === 'corepack'), false);
});
for (const nodeVersion of ['v24.22.0', 'v26.12.1']) test(`Given Node ${nodeVersion}, When server preflight runs, Then exact Node 24.22.1 is required before package-manager checks`, async (t) => {
  const fixture = await mcpFixture(t);
  const shim = await systemShim(fixture);
  await assert.rejects(inspectMcpServer(fixture.config, { ...shim.preflight, nodeVersion }), /Node 24\.22\.1/);
  assert.deepEqual((await shim.state()).calls, []);
});
test('Given an existing receipt without package-manager metadata, When server preflight runs, Then its managed deployment remains compatible', async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  await runMcpRemoteOperation('activate', plan, shim);
  await runMcpRemoteOperation('commit', plan, shim);
  const file = path.join(fixture.config.remoteRoot, 'deployment.json');
  const receipt = JSON.parse(await readFile(file, 'utf8'));
  delete receipt.packageManager;
  await writeFile(file, JSON.stringify(receipt));
  const server = await inspectMcpServer(fixture.config, shim.preflight);
  assert.equal(server.receipt.packageManager, undefined);
  assert.equal(server.packageManager.command, 'pnpm');
});
for (const failure of ['install', 'start']) test(`Given an initial ${failure} failure, When activation fails, Then no service or unit remains and rollback holds the lock for verification`, async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  if (failure === 'install') shim.install = async () => { throw new Error('install failed'); };
  else await shim.state({ startFail: true });
  await assert.rejects(runMcpRemoteOperation('activate', plan, shim), /복구했습니다/);
  const state = await shim.state();
  assert.equal(state.active, 'inactive');
  assert.equal(state.enabled, 'disabled');
  await assert.rejects(readFile(path.join(fixture.config.unitDirectory, `${fixture.config.service}.service`)), { code: 'ENOENT' });
  assert.equal(await readFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), 'utf8'), plan.owner);
  await runMcpRemoteOperation('rollback-finalize', plan, shim);
});
test('Given a managed update, When local post-verification fails, Then old index, current, unit and active/enabled state are restored', async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  await runMcpRemoteOperation('activate', plan, shim);
  await runMcpRemoteOperation('commit', plan, shim);
  const before = {
    index: await readFile(path.join(fixture.config.remoteRoot, 'archive/versions/index.json'), 'utf8'),
    unit: await readFile(path.join(fixture.config.unitDirectory, `${fixture.config.service}.service`), 'utf8'),
    current: await readlink(path.join(fixture.config.remoteRoot, 'current')),
  };
  await writeMcpFixtureBundle(fixture, { releaseId: '20261024-120000-0123456789ab', createdAt: '2026-10-24T03:00:00.000Z' });
  const next = await prepareMcpBundle(fixture.bundle);
  t.after(next.cleanup);
  const update = await stageMcpFixture(fixture, next, '22222222-2222-4222-8222-222222222222');
  await runMcpRemoteOperation('activate', update, shim);
  await runMcpRemoteOperation('rollback', update, shim);
  assert.equal(await readlink(path.join(fixture.config.remoteRoot, 'current')), before.current);
  assert.equal(await readFile(path.join(fixture.config.remoteRoot, 'archive/versions/index.json'), 'utf8'), before.index);
  assert.equal(await readFile(path.join(fixture.config.unitDirectory, `${fixture.config.service}.service`), 'utf8'), before.unit);
  assert.equal((await shim.state()).active, 'active');
  assert.equal((await shim.state()).enabled, 'enabled');
  await readFile(path.join(fixture.config.remoteRoot, `archive/versions/${plan.metadata.releaseId}/index.html`));
  await runMcpRemoteOperation('rollback-finalize', update, shim);
});
test('Given a newer managed latest, When an older bundle is deployed, Then downgrade is refused and existing snapshots remain', async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  await runMcpRemoteOperation('activate', plan, shim);
  await runMcpRemoteOperation('commit', plan, shim);
  const old = await prepareMcpBundle(fixture.bundle);
  t.after(old.cleanup);
  await writeMcpFixtureBundle(fixture, { releaseId: '20261024-120000-0123456789ab', createdAt: '2026-10-24T03:00:00.000Z' });
  const next = await prepareMcpBundle(fixture.bundle);
  t.after(next.cleanup);
  const second = await stageMcpFixture(fixture, next, '22222222-2222-4222-8222-222222222222');
  await runMcpRemoteOperation('activate', second, shim);
  await runMcpRemoteOperation('commit', second, shim);
  const stale = await stageMcpFixture(fixture, old, '33333333-3333-4333-8333-333333333333');
  await assert.rejects(runMcpRemoteOperation('activate', stale, shim), /다운그레이드/);
  const index = JSON.parse(await readFile(path.join(fixture.config.remoteRoot, 'archive/versions/index.json'), 'utf8'));
  assert.equal(index.latestReleaseId, next.metadata.releaseId);
  assert.equal(index.releases.length, 2);
  await runMcpRemoteOperation('rollback-finalize', stale, shim);
});
test('Given a stolen lock, When rollback is attempted, Then it refuses to change current or remove the new owner', async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  await runMcpRemoteOperation('activate', plan, shim);
  const before = await readlink(path.join(fixture.config.remoteRoot, 'current'));
  await writeFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), 'another-owner');
  await assert.rejects(runMcpRemoteOperation('rollback', plan, shim), /소유자/);
  assert.equal(await readlink(path.join(fixture.config.remoteRoot, 'current')), before);
  assert.equal(await readFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), 'utf8'), 'another-owner');
});
for (const failure of ['runtime', 'unmanaged-unit', 'port', 'lock']) test(`Given ${failure}, When server preflight runs, Then it refuses before installing`, async (t) => {
  const fixture = await mcpFixture(t);
  const shim = await systemShim(fixture);
  if (failure === 'runtime') await shim.state({ runtimeFail: true });
  if (failure === 'port') await shim.state({ portBusy: true });
  if (failure === 'unmanaged-unit') await writeFile(path.join(fixture.config.unitDirectory, `${fixture.config.service}.service`), '[Service]\nExecStart=/bin/true');
  if (failure === 'lock') { const bundle = await prepareMcpBundle(fixture.bundle); t.after(bundle.cleanup); await stageMcpFixture(fixture, bundle); }
  await assert.rejects(inspectMcpServer(fixture.config, shim.preflight));
  assert.equal((await shim.state()).calls.some((call) => ['start', 'restart', 'enable'].includes(call[1])), false);
});

for (const directory of ['owp-playground-mcp.service.d', 'owp-playground-.service.d', 'owp-.service.d', 'service.d']) test(`Given orphan ${directory}, When initial preflight runs, Then inherited configuration is rejected before a unit exists`, async (t) => {
  const fixture = await mcpFixture(t);
  const shim = await systemShim(fixture);
  await mkdir(path.join(fixture.config.unitDirectory, directory));
  await writeFile(path.join(fixture.config.unitDirectory, directory, 'override.conf'), '[Service]\nExecStartPre=/bin/false');
  await assert.rejects(inspectMcpServer(fixture.config, shim.preflight), /drop-in/);
});
test('Given a drop-in loaded during daemon-reload, When initial activation runs, Then all unit side effects are refused and recovery ownership is preserved', async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  const original = shim.run;
  shim.run = async (command, args) => {
    if (args[0] === 'daemon-reload') await shim.state({ dropins: '/unmanaged/override.conf' });
    return original(command, args);
  };
  await assert.rejects(runMcpRemoteOperation('activate', plan, shim), /drop-in/);
  const calls = (await shim.state()).calls;
  assert.equal(calls.some((call) => ['enable', 'start', 'restart', 'stop', 'disable'].includes(call[1])), false);
  await readFile(path.join(fixture.config.unitDirectory, `${fixture.config.service}.service`));
  assert.equal(await readFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), 'utf8'), plan.owner);
});
test('Given an activated deployment, When effective drop-ins change before commit, Then commit fails and retains ownership', async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  await runMcpRemoteOperation('activate', plan, shim);
  await shim.state({ dropins: '/unmanaged/override.conf' });
  await assert.rejects(runMcpRemoteOperation('commit', plan, shim), /drop-in/);
  assert.equal(await readFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), 'utf8'), plan.owner);
});

test('Given server snapshots omitted from a newer partial bundle, When updating, Then merge preserves them and changes latest atomically', async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  await runMcpRemoteOperation('activate', plan, shim);
  await runMcpRemoteOperation('commit', plan, shim);
  const oldPath = path.join(fixture.config.remoteRoot, `archive/versions/${plan.metadata.releaseId}/index.html`);
  const oldBytes = await readFile(oldPath);
  const release = await writeMcpFixtureBundle(fixture, { releaseId: '20261024-120000-0123456789ab', createdAt: '2026-10-24T03:00:00.000Z' });
  const index = JSON.parse(await readFile(path.join(fixture.archiveRoot, 'versions/index.json')));
  index.releases = index.releases.filter((entry) => entry.releaseId === release.releaseId);
  const entries = (await directoryEntries(fixture.archiveRoot)).filter((entry) => !entry.name.startsWith(`versions/${plan.metadata.releaseId}/`)).map((entry) => entry.name === 'versions/index.json' ? { ...entry, content: JSON.stringify(index) } : entry);
  const compressed = tarBytes(entries);
  await writeFile(path.join(fixture.bundle, 'archive.tar.gz'), compressed);
  release.stableReleaseIds = [release.releaseId];
  release.files['archive.tar.gz'] = { bytes: compressed.length, sha256: sha256(compressed) };
  await writeFixtureMetadata(fixture.bundle, release);
  const partial = await prepareMcpBundle(fixture.bundle);
  t.after(partial.cleanup);
  const next = await stageMcpFixture(fixture, partial, '22222222-2222-4222-8222-222222222222');
  await runMcpRemoteOperation('activate', next, shim);
  await runMcpRemoteOperation('commit', next, shim);
  assert.deepEqual(await readFile(oldPath), oldBytes);
  const merged = JSON.parse(await readFile(path.join(fixture.config.remoteRoot, 'archive/versions/index.json')));
  assert.equal(merged.latestReleaseId, release.releaseId);
  assert.deepEqual(merged.releases.map((entry) => entry.releaseId), [plan.metadata.releaseId, release.releaseId]);
});
