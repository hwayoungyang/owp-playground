import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, readlink, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { sha256 } from '../deploy-mcp-tar.mjs';
import { prepareMcpBundle } from '../deploy-mcp-bundle.mjs';
import { inspectMcpServer } from '../deploy-mcp-preflight.mjs';
import { runMcpRemoteOperation } from '../deploy-mcp-remote.mjs';
import { cleanupMcpTerminal, durableMcpRecord, maintainMcpDeployment, mcpCommitMarker, readMcpCommit } from '../deploy-mcp-retention.mjs';
import { releaseMcpLock } from '../deploy-mcp-transaction.mjs';
import { directoryEntries, mcpFixture, stageMcpFixture, systemShim, tarBytes, writeFixtureMetadata, writeMcpFixtureBundle } from './deploy-mcp-fixture.mjs';

async function scenario(t) {
  const fixture = await mcpFixture(t);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const shim = await systemShim(fixture);
  const plan = await stageMcpFixture(fixture, bundle);
  return { fixture, bundle, shim, plan };
}
async function history(t, count = 5, { legacy = false, retainIncoming = false } = {}) {
  const { fixture, shim, plan } = await scenario(t);
  const receipts = [];
  const markers = [];
  const plans = [];
  for (let index = 0; index < count; index++) {
    let selected = plan;
    if (index) {
      await writeMcpFixtureBundle(fixture, { releaseId: `2026102${index + 3}-120000-0123456789ab`, createdAt: `2026-10-2${index + 3}T03:00:00.000Z` });
      const bundle = await prepareMcpBundle(fixture.bundle);
      t.after(bundle.cleanup);
      selected = await stageMcpFixture(fixture, bundle, `${String(index + 1).repeat(8)}-2222-4222-8222-222222222222`);
    }
    receipts.push(await runMcpRemoteOperation('activate', selected, shim));
    plans.push(selected);
    await runMcpRemoteOperation('commit', selected, legacy || retainIncoming ? { ...shim, cleanup: { remove: async (directory, options) => {
      if (legacy && path.dirname(directory) === path.join(fixture.config.remoteRoot, 'apps')) throw new Error('기존 CLI 실행본을 재현하기 위해 보존합니다.');
      if (retainIncoming && directory === plan.incoming) throw new Error('committed incoming deletion denied');
      await rm(directory, options);
    } } } : shim);
    markers.push(await readFile(path.join(receipts.at(-1).appDirectory, mcpCommitMarker)));
    if (legacy) {
      await rm(path.join(receipts.at(-1).appDirectory, mcpCommitMarker));
      // 이전 CLI에는 앱 밖 삭제 intent가 없었습니다.
      await rm(path.join(fixture.config.remoteRoot, '.retention-cleanup.json'), { force: true });
    }
  }
  return { fixture, shim, receipts, markers, plans };
}
async function updatePlan(t, fixture, index = 8) {
  await writeMcpFixtureBundle(fixture, { releaseId: `2026102${index}-120000-0123456789ab`, createdAt: `2026-10-2${index}T03:00:00.000Z` });
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  return stageMcpFixture(fixture, bundle, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
}
async function preservedHistory(t, count = 5, legacy = false) {
  const result = await history(t, count, { legacy: true });
  for (let index = legacy ? count - 1 : 0; index < count; index++) await writeFile(path.join(result.receipts[index].appDirectory, mcpCommitMarker), result.markers[index]);
  return result;
}
async function unfinishedState(fixture, previous, owner) {
  const root = fixture.config.remoteRoot;
  const appDirectory = path.join(root, 'apps', `${previous.releaseId}-${owner}`);
  const manifest = JSON.parse(await readFile(path.join(root, 'archive/versions', previous.releaseId, 'knowledge-release.json'), 'utf8'));
  const rollbackBaseline = { receipt: previous, manifest, active: 'active', enabled: 'enabled' };
  const unitPath = path.join(fixture.config.unitDirectory, `${fixture.config.service}.service`);
  const unit = await readFile(unitPath, 'utf8');
  const index = await readFile(path.join(root, 'archive/versions/index.json'), 'utf8');
  return { owner, root, appDirectory, beforeCurrent: previous.appDirectory, rollbackBaseline, phase: 'prepared',
    previousReceipt: JSON.stringify(previous), nextReceipt: JSON.stringify({ ...previous, owner, appDirectory }),
    previousUnit: unit, nextUnit: unit, unitPath, active: 'active', enabled: 'enabled', previousIndex: index, nextIndex: index };
}
for (const legacy of [false, true]) test(`retention stops when a deleted ${legacy ? 'legacy' : 'committed'} candidate reappears before the next removal`, async (t) => {
  const result = legacy ? await preservedHistory(t, 5, true) : await history(t, 5, { legacy: true, retainIncoming: true });
  const { fixture, receipts, markers, plans } = result;
  if (!legacy) for (let index = 0; index < receipts.length; index++) await writeFile(path.join(receipts[index].appDirectory, mcpCommitMarker), markers[index]);
  const update = await updatePlan(t, fixture);
  const [first, second] = receipts;
  let recreated = false;
  const cleanup = await maintainMcpDeployment(update, { beforeRemove: async (directory) => {
    if (directory !== second.appDirectory) return;
    await assert.rejects(lstat(first.appDirectory), { code: 'ENOENT' });
    await mkdir(first.appDirectory);
    await writeFile(path.join(first.appDirectory, 'sentinel'), 'reappeared directory');
    recreated = true;
  } });
  assert.equal(recreated, true);
  assert.equal(await readFile(path.join(first.appDirectory, 'sentinel'), 'utf8'), 'reappeared directory');
  assert.ok(await lstat(second.appDirectory));
  if (!legacy) assert.ok(await lstat(plans[0].incoming));
  assert.ok(cleanup.warnings.length > 0);
});
test('retention preserves a committed app and its incoming when the stable manifest contract is damaged', async (t) => {
  const { fixture, receipts, markers, plans } = await history(t, 4, { legacy: true, retainIncoming: true });
  for (let index = 0; index < receipts.length; index++) await writeFile(path.join(receipts[index].appDirectory, mcpCommitMarker), markers[index]);
  const update = await updatePlan(t, fixture);
  const oldest = receipts[0];
  const file = path.join(fixture.config.remoteRoot, 'archive/versions', oldest.releaseId, 'knowledge-release.json');
  const original = await readFile(file, 'utf8');
  const cases = {
    'empty-commit': (value) => { value.commit = ''; },
    'short-commit': (value) => { value.commit = oldest.head.slice(0, 6); },
    'long-commit': (value) => { value.commit = `${oldest.head}0`; },
    'nonhex-commit': (value) => { value.commit = 'x'.repeat(12); },
    'missing-dirty': (value) => { delete value.dirty; },
    'zero-dirty': (value) => { value.dirty = 0; },
    'null-dirty': (value) => { value.dirty = null; },
  };
  for (const [name, change] of Object.entries(cases)) await t.test(name, async () => {
    const manifest = JSON.parse(original);
    change(manifest);
    await writeFile(file, JSON.stringify(manifest));
    try {
      const cleanup = await maintainMcpDeployment(update);
      assert.ok(cleanup.warnings.length > 0);
      assert.ok(await lstat(oldest.appDirectory));
      assert.ok(await lstat(plans[0].incoming));
      assert.equal(await readFile(file, 'utf8'), JSON.stringify(manifest));
    } finally { await writeFile(file, original); }
  });
});
test('terminal failed cleanup preserves incoming when another deleted app reappears after lock release', async (t) => {
  const { fixture, shim, receipts } = await preservedHistory(t, 4);
  const failed = await updatePlan(t, fixture);
  await assert.rejects(runMcpRemoteOperation('activate', failed, { ...shim, install: async () => { throw new Error('installation failed'); } }));
  await runMcpRemoteOperation('rollback-finalize', failed, { ...shim, cleanup: { remove: async () => { throw new Error('retain cleanup evidence'); } } });
  await mkdir(path.join(fixture.config.remoteRoot, '.deploy.lock'));
  await writeFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), failed.owner);
  const oldest = receipts[0].appDirectory;
  const warnings = await cleanupMcpTerminal(failed, async (context) => {
    await assert.rejects(lstat(oldest), { code: 'ENOENT' });
    await releaseMcpLock(context);
    await mkdir(oldest);
    await writeFile(path.join(oldest, 'sentinel'), 'reappeared after release');
  });
  assert.equal(await readFile(path.join(oldest, 'sentinel'), 'utf8'), 'reappeared after release');
  assert.ok(await lstat(failed.incoming));
  assert.ok(warnings.length > 0);
});
for (const change of ['release-json', 'release-head', 'baseline-json', 'baseline-owner']) test(`an absent failed app preserves incoming with damaged ${change} evidence`, async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  await assert.rejects(runMcpRemoteOperation('activate', plan, { ...shim, install: async () => { throw new Error('installation failed'); } }));
  await runMcpRemoteOperation('rollback-finalize', plan, { ...shim, cleanup: { remove: async (directory, options) => {
    if (directory === plan.incoming) throw new Error('retain terminal incoming');
    return rm(directory, options);
  } } });
  const failedApp = path.join(fixture.config.remoteRoot, 'apps', `${plan.metadata.releaseId}-${plan.owner}`);
  await assert.rejects(lstat(failedApp), { code: 'ENOENT' });
  const file = path.join(plan.incoming, change.startsWith('release') ? 'release.json' : 'baseline.json');
  const value = JSON.parse(await readFile(file, 'utf8'));
  if (change.endsWith('head')) value.head = 'f'.repeat(40);
  else if (change.endsWith('owner')) value.owner = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const content = change.endsWith('json') ? '{' : JSON.stringify(value);
  await writeFile(file, content);
  const next = await updatePlan(t, fixture);
  const result = await maintainMcpDeployment(next);
  assert.ok(result.warnings.length > 0);
  assert.ok(await lstat(plan.incoming));
  assert.equal(await readFile(file, 'utf8'), content);
});
test('an absent failed app preserves incoming when transaction receipt or baseline internals are damaged', async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  await runMcpRemoteOperation('activate', plan, shim);
  await runMcpRemoteOperation('rollback', plan, shim);
  await runMcpRemoteOperation('rollback-finalize', plan, { ...shim, cleanup: { remove: async (directory, options) => {
    if (directory === plan.incoming) throw new Error('retain finalized transaction');
    return rm(directory, options);
  } } });
  const file = path.join(plan.incoming, 'transaction.json');
  const original = await readFile(file, 'utf8');
  const next = await updatePlan(t, fixture);
  const receiptChange = (state, change) => { const value = JSON.parse(state.nextReceipt); change(value); state.nextReceipt = JSON.stringify(value); };
  const cases = {
    'receipt-json': (state) => { state.nextReceipt = '{'; },
    'receipt-owner': (state) => receiptChange(state, (value) => { value.owner = next.owner; }),
    'receipt-head': (state) => receiptChange(state, (value) => { value.head = 'f'.repeat(40); }),
    'receipt-app': (state) => receiptChange(state, (value) => { value.appDirectory = path.join(fixture.config.remoteRoot, 'apps/replacement'); }),
    'receipt-root': (state) => receiptChange(state, (value) => { value.root = fixture.root; }),
    'receipt-schema': (state) => receiptChange(state, (value) => { value.schemaVersion = 2; }),
    'baseline-active': (state) => { state.rollbackBaseline.active = 'active'; },
    'baseline-missing': (state) => { delete state.rollbackBaseline; },
    'previous-receipt-json': (state) => { state.previousReceipt = '{'; },
    'next-unit': (state) => { state.nextUnit += '\nchanged'; },
    'active-state': (state) => { state.active = 'active'; },
    'enabled-state': (state) => { state.enabled = 'enabled'; },
  };
  for (const [name, change] of Object.entries(cases)) await t.test(name, async () => {
    const state = JSON.parse(original); change(state);
    const content = JSON.stringify(state); await writeFile(file, content);
    try {
      const result = await maintainMcpDeployment(next);
      assert.ok(result.warnings.length > 0);
      assert.equal(await readFile(file, 'utf8'), content);
    } finally { await writeFile(file, original); }
  });
});
for (const marker of [false, true]) test(`retention watches an unclassified preserved app with ${marker ? 'damaged marker' : 'unknown namespace'}`, async (t) => {
  const { fixture, receipts, markers, plans } = await history(t, 5, { legacy: true, retainIncoming: true });
  for (let index = 0; index < receipts.length; index++) await writeFile(path.join(receipts[index].appDirectory, mcpCommitMarker), markers[index]);
  const unknown = path.join(fixture.config.remoteRoot, 'apps/unclassified-preserved');
  await mkdir(unknown);
  if (marker) await writeFile(path.join(unknown, mcpCommitMarker), '{}');
  const next = await updatePlan(t, fixture);
  let observed = false;
  const result = await maintainMcpDeployment(next, { beforeRemove: async (directory) => {
    if (directory !== receipts[0].appDirectory) return;
    observed = true;
    await rename(unknown, `${unknown}.moved`);
    await mkdir(unknown);
    await writeFile(path.join(unknown, 'sentinel'), 'unclassified replacement');
  } });
  assert.equal(observed, true);
  assert.equal(await readFile(path.join(unknown, 'sentinel'), 'utf8'), 'unclassified replacement');
  assert.ok(await lstat(receipts[0].appDirectory));
  assert.ok(await lstat(receipts[1].appDirectory));
  assert.ok(await lstat(plans[0].incoming));
  assert.ok(result.warnings.length > 0);
});
test('terminal cleanup preserves incoming when current and receipt change after lock release', async (t) => {
  const { fixture, shim, receipts } = await history(t, 3);
  const update = await updatePlan(t, fixture);
  await runMcpRemoteOperation('activate', update, shim);
  await runMcpRemoteOperation('commit', update, { ...shim, cleanup: { remove: async (directory, options) => {
    if (directory === update.incoming) throw new Error('retain committed incoming');
    return rm(directory, options);
  } } });
  await mkdir(path.join(fixture.config.remoteRoot, '.deploy.lock'));
  await writeFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), update.owner);
  const previous = receipts.at(-1);
  const warnings = await cleanupMcpTerminal(update, async (context) => {
    await releaseMcpLock(context);
    await rm(path.join(fixture.config.remoteRoot, 'current'));
    await symlink(previous.appDirectory, path.join(fixture.config.remoteRoot, 'current'));
    await writeFile(path.join(fixture.config.remoteRoot, 'deployment.json'), JSON.stringify(previous));
  });
  assert.ok(await lstat(update.incoming));
  assert.ok(warnings.length > 0);
  assert.equal(await readlink(path.join(fixture.config.remoteRoot, 'current')), previous.appDirectory);
});
test('a pending app disappearing after collection preserves intent and incoming and stops later candidates', async (t) => {
  const { fixture, receipts, markers, plans } = await history(t, 5, { legacy: true, retainIncoming: true });
  for (let index = 0; index < receipts.length; index++) await writeFile(path.join(receipts[index].appDirectory, mcpCommitMarker), markers[index]);
  const first = await updatePlan(t, fixture);
  const oldest = receipts[0].appDirectory;
  await maintainMcpDeployment(first, { remove: async (directory, options) => {
    if (directory === oldest) throw new Error('retain pending app');
    return rm(directory, options);
  } });
  const file = path.join(fixture.config.remoteRoot, '.retention-cleanup.json');
  const original = await readFile(file, 'utf8');
  await rm(first.incoming, { recursive: true });
  const bundle = await prepareMcpBundle(fixture.bundle); t.after(bundle.cleanup);
  const next = await stageMcpFixture(fixture, bundle, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
  const result = await maintainMcpDeployment(next, { afterCollect: () => rm(oldest, { recursive: true }) });
  assert.equal(await readFile(file, 'utf8'), original);
  assert.ok(await lstat(receipts[1].appDirectory));
  assert.ok(await lstat(plans[0].incoming));
  assert.ok(result.warnings.length > 0);
});
test('a missing predecessor restored after collection stops app and incoming deletion', async (t) => {
  const { fixture, receipts, markers, plans } = await history(t, 5, { legacy: true, retainIncoming: true });
  for (let index = 0; index < receipts.length; index++) await writeFile(path.join(receipts[index].appDirectory, mcpCommitMarker), markers[index]);
  const missing = receipts[3].appDirectory;
  const moved = path.join(fixture.root, 'temporarily-missing-predecessor');
  await rename(missing, moved);
  const next = await updatePlan(t, fixture);
  const result = await maintainMcpDeployment(next, { afterCollect: () => rename(moved, missing) });
  assert.ok(await lstat(missing));
  assert.ok(await lstat(receipts[0].appDirectory));
  assert.ok(await lstat(plans[0].incoming));
  assert.ok(result.warnings.length > 0);
});
test('a committed incoming with its app present preserves inconsistent terminal control evidence', async (t) => {
  const { fixture, plans } = await history(t, 1, { retainIncoming: true });
  const incoming = plans[0].incoming;
  const next = await updatePlan(t, fixture);
  const files = ['transaction.json', 'attempt.json', 'baseline.json'];
  const originals = Object.fromEntries(await Promise.all(files.map(async (name) => [name, await readFile(path.join(incoming, name), 'utf8')])));
  const cases = {
    'receipt-json': ['transaction.json', (value) => { value.nextReceipt = '{'; }],
    'transaction-baseline': ['transaction.json', (value) => { value.rollbackBaseline.active = 'active'; }],
    'attempt-head': ['attempt.json', (value) => { value.head = 'f'.repeat(40); }],
    'attempt-app': ['attempt.json', (value) => { value.appDirectory = path.join(fixture.config.remoteRoot, 'apps/other'); }],
    'attempt-previous': ['attempt.json', (value) => { value.beforeCurrent = path.join(fixture.config.remoteRoot, 'apps/other'); }],
    'baseline-owner': ['baseline.json', (value) => { value.owner = next.owner; }],
  };
  for (const [name, [file, change]] of Object.entries(cases)) await t.test(name, async () => {
    const value = JSON.parse(originals[file]); change(value);
    const content = JSON.stringify(value); await writeFile(path.join(incoming, file), content);
    try {
      const result = await maintainMcpDeployment(next);
      assert.ok(result.warnings.length > 0);
      assert.equal(await readFile(path.join(incoming, file), 'utf8'), content);
    } finally { for (const [name, content] of Object.entries(originals)) await writeFile(path.join(incoming, name), content); }
  });
});
test('unfinished serialized receipt references are validated and preserved', async (t) => {
  const { fixture, receipts, markers, plans } = await history(t, 5, { legacy: true, retainIncoming: true });
  for (let index = 0; index < receipts.length; index++) await writeFile(path.join(receipts[index].appDirectory, mcpCommitMarker), markers[index]);
  const next = await updatePlan(t, fixture);
  const owner = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const incoming = path.join(fixture.config.remoteRoot, `.incoming-${owner}`);
  await mkdir(incoming); await writeFile(path.join(incoming, 'owner'), owner);
  const state = await unfinishedState(fixture, receipts.at(-1), owner);
  await writeFile(path.join(incoming, 'baseline.json'), JSON.stringify({ owner, root: fixture.config.remoteRoot, baseline: state.rollbackBaseline }));
  const file = path.join(incoming, 'transaction.json');
  const cases = {
    'previous-victim': (value) => { value.previousReceipt = JSON.stringify(receipts[0]); },
    'previous-json': (value) => { value.previousReceipt = '{'; },
    'next-json': (value) => { value.nextReceipt = '{'; },
    'next-owner': (value) => { value.nextReceipt = JSON.stringify({ ...JSON.parse(value.nextReceipt), owner: next.owner }); },
    'next-app': (value) => { value.nextReceipt = JSON.stringify(receipts[0]); },
    'missing-next': (value) => { delete value.nextReceipt; },
  };
  for (const [name, change] of Object.entries(cases)) await t.test(name, async () => {
    const value = structuredClone(state); change(value); const content = JSON.stringify(value);
    await writeFile(file, content);
    const result = await maintainMcpDeployment(next);
    assert.ok(result.warnings.length > 0);
    assert.ok(await lstat(receipts[0].appDirectory));
    assert.ok(await lstat(plans[0].incoming));
    assert.equal(await readFile(file, 'utf8'), content);
  });
});
test('a consistent unfinished serialized transaction protects its app while unrelated old apps are reclaimed', async (t) => {
  const { fixture, receipts } = await preservedHistory(t, 5);
  const next = await updatePlan(t, fixture);
  const owner = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const incoming = path.join(fixture.config.remoteRoot, `.incoming-${owner}`);
  await mkdir(incoming); await writeFile(path.join(incoming, 'owner'), owner);
  await writeFile(path.join(incoming, 'transaction.json'), JSON.stringify(await unfinishedState(fixture, receipts.at(-1), owner)));
  const result = await maintainMcpDeployment(next);
  assert.deepEqual(result.warnings, []);
  await assert.rejects(lstat(receipts[0].appDirectory), { code: 'ENOENT' });
  await assert.rejects(lstat(receipts[1].appDirectory), { code: 'ENOENT' });
  assert.ok(await lstat(incoming));
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 3);
});
test('unfinished transaction and attempt disagreements preserve every recovery reference', async (t) => {
  const { fixture, receipts } = await preservedHistory(t, 5);
  const next = await updatePlan(t, fixture);
  const owner = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const directory = path.join(fixture.config.remoteRoot, `.incoming-${owner}`);
  await mkdir(directory); await writeFile(path.join(directory, 'owner'), owner);
  const transaction = await unfinishedState(fixture, receipts.at(-1), owner);
  const rollbackBaseline = transaction.rollbackBaseline;
  await writeFile(path.join(directory, 'transaction.json'), JSON.stringify(transaction));
  await writeFile(path.join(directory, 'baseline.json'), JSON.stringify({ owner, root: fixture.config.remoteRoot, baseline: rollbackBaseline }));
  const file = path.join(directory, 'attempt.json');
  const victim = receipts[0];
  const cases = {
    app: (attempt) => { attempt.appDirectory = victim.appDirectory; },
    previous: (attempt) => { attempt.beforeCurrent = victim.appDirectory; },
    baseline: (attempt) => { attempt.rollbackBaseline = { receipt: victim }; },
    owner: (attempt) => { attempt.owner = next.owner; attempt.beforeCurrent = victim.appDirectory; },
  };
  for (const [name, change] of Object.entries(cases)) await t.test(name, async () => {
    const receipt = JSON.parse(transaction.nextReceipt);
    const attempt = structuredClone({ owner, root: fixture.config.remoteRoot, appDirectory: transaction.appDirectory, beforeCurrent: transaction.beforeCurrent,
      rollbackBaseline: transaction.rollbackBaseline, releaseId: receipt.releaseId, head: receipt.head, phase: 'installing' }); change(attempt);
    await writeFile(file, JSON.stringify(attempt));
    const result = await maintainMcpDeployment(next);
    assert.ok(result.warnings.length > 0);
    assert.ok(await lstat(victim.appDirectory));
    assert.equal(await readFile(file, 'utf8'), JSON.stringify(attempt));
  });
});
for (const kind of ['rollback-finalized', 'superseded-pre-transaction', 'superseded-rolled-back']) for (const change of ['replaced', 'appeared']) test(`retention preserves a ${kind} failed app ${change} after an earlier candidate`, async (t) => {
  const { fixture, shim, receipts } = await preservedHistory(t, kind === 'rollback-finalized' ? 5 : 4);
  const failed = await updatePlan(t, fixture);
  if (kind === 'superseded-rolled-back') {
    await runMcpRemoteOperation('activate', failed, shim);
    await runMcpRemoteOperation('rollback', failed, shim);
  } else await assert.rejects(runMcpRemoteOperation('activate', failed, { ...shim, install: async () => { throw new Error('installation failed'); } }));
  if (kind === 'rollback-finalized') await runMcpRemoteOperation('rollback-finalize', failed, { ...shim, cleanup: { remove: async () => { throw new Error('retain failed evidence'); } } });
  else await rm(path.join(failed.incoming, 'attempt.json'));
  const failedApp = path.join(fixture.config.remoteRoot, 'apps', `${failed.metadata.releaseId}-${failed.owner}`);
  if (change === 'appeared') await rm(failedApp, { recursive: true });
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const plan = await stageMcpFixture(fixture, bundle, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
  const anchor = receipts.at(-1);
  const context = { ...plan, baselineVerified: { appDirectory: anchor.appDirectory, releaseId: anchor.releaseId, head: anchor.head } };
  let evidence;
  const replace = async (directory) => {
    if (directory !== receipts[0].appDirectory) return;
    evidence = Object.fromEntries((await directoryEntries(failed.incoming)).map((entry) => [entry.name, sha256(entry.content)]));
    if (change === 'replaced') await rename(failedApp, `${failedApp}.moved`);
    await mkdir(failedApp);
    await writeFile(path.join(failedApp, 'sentinel'), 'new directory must remain');
  };
  const result = await maintainMcpDeployment(context, change === 'replaced' ? { beforeRemove: replace } : { remove: async (directory, options) => {
    await rm(directory, options);
    await replace(directory);
  } });
  assert.ok(evidence, 'the earlier normal candidate must be processed before changing the failed app');
  assert.equal(await readFile(path.join(failedApp, 'sentinel'), 'utf8'), 'new directory must remain');
  assert.ok(result.warnings.length > 0);
  assert.deepEqual(Object.fromEntries((await directoryEntries(failed.incoming)).map((entry) => [entry.name, sha256(entry.content)])), evidence);
  if (change === 'replaced') assert.ok(await lstat(receipts[0].appDirectory), 'a replacement observed before removal must preserve the current candidate too');
  else await assert.rejects(lstat(receipts[0].appDirectory), { code: 'ENOENT' });
  if (kind === 'rollback-finalized') assert.ok(await lstat(receipts[1].appDirectory), 'the next normal candidate must remain after failed identity changes');
});
for (const journal of ['invalid-json', 'invalid-envelope']) test(`rollback finalization preserves a remaining failed app and incoming after ${journal} cleanup intent`, async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  await assert.rejects(runMcpRemoteOperation('activate', plan, { ...shim, install: async () => { throw new Error('installation failed'); } }));
  const failedApp = path.join(fixture.config.remoteRoot, 'apps', `${plan.metadata.releaseId}-${plan.owner}`);
  const file = path.join(fixture.config.remoteRoot, '.retention-cleanup.json');
  const content = journal === 'invalid-json' ? '{' : '{}';
  await writeFile(file, content);
  const result = await runMcpRemoteOperation('rollback-finalize', plan, shim);
  assert.ok(result.cleanupWarnings.length > 0);
  assert.ok(await lstat(failedApp));
  assert.equal(JSON.parse(await readFile(path.join(plan.incoming, 'attempt.json'), 'utf8')).phase, 'rollback-finalized');
  assert.equal(JSON.parse(await readFile(path.join(plan.incoming, 'cleanup.json'), 'utf8')).value.kind, 'rollback-finalized');
  assert.equal(await readFile(file, 'utf8'), content);
  await assert.rejects(lstat(path.join(fixture.config.remoteRoot, '.deploy.lock')), { code: 'ENOENT' });
});
test('terminal cleanup preserves incoming when maintenance throws before inspecting terminal evidence', async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  await assert.rejects(runMcpRemoteOperation('activate', plan, { ...shim, install: async () => { throw new Error('installation failed'); } }));
  await runMcpRemoteOperation('rollback-finalize', plan, { ...shim, cleanup: { remove: async () => { throw new Error('retain failed evidence'); } } });
  await mkdir(path.join(fixture.config.remoteRoot, '.deploy.lock'));
  await writeFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), plan.owner);
  await writeFile(path.join(fixture.config.remoteRoot, 'deployment.json'), '{');
  const evidence = Object.fromEntries((await directoryEntries(plan.incoming)).map((entry) => [entry.name, sha256(entry.content)]));
  const warnings = await cleanupMcpTerminal(plan, releaseMcpLock);
  assert.ok(warnings.some((warning) => warning.includes('자동정리 중단')));
  assert.deepEqual(Object.fromEntries((await directoryEntries(plan.incoming)).map((entry) => [entry.name, sha256(entry.content)])), evidence);
  await assert.rejects(lstat(path.join(fixture.config.remoteRoot, '.deploy.lock')), { code: 'ENOENT' });
});
for (const uncertain of [false, true]) test(`rollback finalization ${uncertain ? 'preserves' : 'removes'} an absent failed app incoming with ${uncertain ? 'uncertain' : 'verified'} maintenance evidence`, async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  await assert.rejects(runMcpRemoteOperation('activate', plan, { ...shim, install: async () => { throw new Error('installation failed'); } }));
  const failedApp = path.join(fixture.config.remoteRoot, 'apps', `${plan.metadata.releaseId}-${plan.owner}`);
  await rm(failedApp, { recursive: true });
  if (uncertain) await mkdir(path.join(fixture.config.remoteRoot, '.incoming-unknown'));
  const result = await runMcpRemoteOperation('rollback-finalize', plan, shim);
  if (uncertain) {
    assert.ok(result.cleanupWarnings.length > 0);
    assert.ok(await lstat(path.join(plan.incoming, 'cleanup.json')));
  } else {
    assert.equal(result.cleanupWarnings, undefined);
    await assert.rejects(lstat(plan.incoming), { code: 'ENOENT' });
  }
  await assert.rejects(lstat(path.join(fixture.config.remoteRoot, '.deploy.lock')), { code: 'ENOENT' });
});
for (const change of ['transaction-before-remove', 'rollback-directory-before-remove', 'current-after-remove']) test(`retention batch stops after ${change} without deleting a newly referenced second candidate`, async (t) => {
  const { fixture, receipts } = await preservedHistory(t);
  const update = await updatePlan(t, fixture);
  const [first, second] = receipts;
  let transactionFile;
  if (change !== 'current-after-remove') {
    const owner = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const incoming = path.join(fixture.config.remoteRoot, `.incoming-${owner}`);
    await mkdir(incoming);
    await writeFile(path.join(incoming, 'owner'), owner);
    transactionFile = path.join(incoming, 'transaction.json');
    await writeFile(transactionFile, JSON.stringify(await unfinishedState(fixture, receipts[2], owner)));
  }
  const result = await maintainMcpDeployment(update, {
    beforeRemove: async (directory) => {
      if (directory === first.appDirectory && transactionFile) {
        if (change === 'rollback-directory-before-remove') {
          await rename(receipts[2].appDirectory, `${receipts[2].appDirectory}.moved`);
          await symlink(second.appDirectory, receipts[2].appDirectory);
        } else {
          const state = JSON.parse(await readFile(transactionFile, 'utf8'));
          await writeFile(transactionFile, JSON.stringify({ ...state, beforeCurrent: second.appDirectory }));
        }
      }
    },
    remove: async (directory, options) => {
      await rm(directory, options);
      if (directory === first.appDirectory && change === 'current-after-remove') {
        await rm(path.join(fixture.config.remoteRoot, 'current'));
        await symlink(second.appDirectory, path.join(fixture.config.remoteRoot, 'current'));
        await writeFile(path.join(fixture.config.remoteRoot, 'deployment.json'), JSON.stringify(second));
      }
    },
  });
  assert.ok(result.warnings.length > 0);
  if (transactionFile) assert.ok(await lstat(first.appDirectory));
  assert.ok(await lstat(second.appDirectory));
});
for (const legacy of [false, true]) test(`durable retention intent retries a partially deleted ${legacy ? 'legacy' : 'committed'} app under the next owner`, async (t) => {
  const { fixture, receipts } = await preservedHistory(t, 4, legacy);
  const update = await updatePlan(t, fixture);
  const oldest = receipts[0].appDirectory;
  const journal = path.join(fixture.config.remoteRoot, '.retention-cleanup.json');
  const result = await maintainMcpDeployment(update, { remove: async (directory, options) => {
    if (directory !== oldest) return rm(directory, options);
    assert.ok(await lstat(journal));
    await rm(path.join(directory, mcpCommitMarker), { force: true });
    await rm(path.join(directory, 'mcp'), { recursive: true });
    throw new Error('recursive deletion stopped after proof removal');
  } });
  assert.ok(result.warnings.length > 0);
  const pending = await readFile(journal, 'utf8');
  assert.ok(await lstat(oldest));
  await rm(update.incoming, { recursive: true });
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const next = await stageMcpFixture(fixture, bundle, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
  assert.equal(await readFile(journal, 'utf8'), pending);
  const retried = await maintainMcpDeployment(next);
  assert.deepEqual(retried.warnings, []);
  await assert.rejects(lstat(oldest), { code: 'ENOENT' });
  await assert.rejects(lstat(journal), { code: 'ENOENT' });
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 3);
  for (const receipt of receipts) assert.ok(await lstat(path.join(fixture.config.remoteRoot, 'archive/versions', receipt.releaseId)));
});
for (const change of ['resume', 'replaced-directory', 'changed-control', 'new-current', 'unfinished-reference']) test(`durable failed retention intent crosses owners after partial deletion with ${change}`, async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  const failedApp = path.join(fixture.config.remoteRoot, 'apps', `${plan.metadata.releaseId}-${plan.owner}`);
  const journal = path.join(fixture.config.remoteRoot, '.retention-cleanup.json');
  await assert.rejects(runMcpRemoteOperation('activate', plan, { ...shim, install: async (directory) => {
    await rm(path.join(directory, 'package.json'));
    await writeFile(path.join(directory, 'sentinel'), 'original incomplete app');
    throw new Error('incomplete installation');
  } }));
  await assert.rejects(lstat(path.join(fixture.config.remoteRoot, 'archive/versions', plan.metadata.releaseId, 'knowledge-release.json')), { code: 'ENOENT' });
  const originalIdentity = await lstat(failedApp, { bigint: true });
  const finalized = await runMcpRemoteOperation('rollback-finalize', plan, { ...shim, cleanup: { remove: async (directory, options) => {
    if (directory !== failedApp) return rm(directory, options);
    await rm(path.join(directory, 'mcp'), { recursive: true });
    throw new Error('partial failed app deletion');
  } } });
  assert.ok(finalized.cleanupWarnings.some((warning) => warning.includes('partial failed app deletion')));
  await assert.rejects(lstat(path.join(fixture.config.remoteRoot, '.deploy.lock')), { code: 'ENOENT' });
  const pending = await readFile(journal, 'utf8');
  const intent = JSON.parse(pending).value;
  assert.equal(intent.kind, 'failed');
  assert.equal(intent.identity.ino, String(originalIdentity.ino));
  assert.equal(intent.incoming, plan.incoming);
  assert.ok(Buffer.byteLength(pending) <= 64 * 1024);
  const bundle = await prepareMcpBundle(fixture.bundle);
  t.after(bundle.cleanup);
  const next = await stageMcpFixture(fixture, bundle, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
  if (change === 'replaced-directory') {
    await rename(failedApp, `${failedApp}.moved`);
    await mkdir(failedApp);
    await writeFile(path.join(failedApp, 'sentinel'), 'replacement must remain');
  } else if (change === 'changed-control') {
    const file = path.join(plan.incoming, 'attempt.json');
    await writeFile(file, `${await readFile(file, 'utf8')}\n`);
  } else if (change === 'new-current') await symlink(failedApp, path.join(fixture.config.remoteRoot, 'current'));
  else if (change === 'unfinished-reference') {
    const owner = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const incoming = path.join(fixture.config.remoteRoot, `.incoming-${owner}`);
    await mkdir(incoming);
    await writeFile(path.join(incoming, 'owner'), owner);
    await writeFile(path.join(incoming, 'transaction.json'), JSON.stringify({ root: fixture.config.remoteRoot, owner, appDirectory: failedApp, beforeCurrent: failedApp, phase: 'prepared' }));
  }
  const evidence = Object.fromEntries((await directoryEntries(plan.incoming)).map((entry) => [entry.name, sha256(entry.content)]));
  const retried = await maintainMcpDeployment(next);
  if (change === 'resume') {
    assert.deepEqual(retried.warnings, []);
    for (const file of [failedApp, journal, plan.incoming]) await assert.rejects(lstat(file), { code: 'ENOENT' });
  } else {
    assert.ok(retried.warnings.length > 0);
    assert.equal(retried.canRemoveCurrentIncoming, false);
    assert.equal(await readFile(path.join(failedApp, 'sentinel'), 'utf8'), change === 'replaced-directory' ? 'replacement must remain' : 'original incomplete app');
    assert.equal(await readFile(journal, 'utf8'), pending);
    assert.deepEqual(Object.fromEntries((await directoryEntries(plan.incoming)).map((entry) => [entry.name, sha256(entry.content)])), evidence);
  }
});
for (const failure of ['intent-write', 'intent-sync', 'replaced-directory', 'new-current', 'changed-source', 'changed-marker']) test(`retention intent preserves evidence after ${failure}`, async (t) => {
  const { fixture, receipts } = await preservedHistory(t);
  const update = await updatePlan(t, fixture);
  const oldest = receipts[0].appDirectory;
  const journal = path.join(fixture.config.remoteRoot, '.retention-cleanup.json');
  const result = await maintainMcpDeployment(update, failure.startsWith('intent-') ? { writeIntent: async (...args) => {
    if (failure === 'intent-sync') await durableMcpRecord(...args);
    throw new Error('intent write or directory sync failed');
  } } : { remove: async () => { throw new Error('delete denied'); } });
  assert.ok(result.warnings.length > 0);
  for (const receipt of receipts) assert.ok(await lstat(receipt.appDirectory));
  if (failure === 'intent-write') {
    await assert.rejects(lstat(journal), { code: 'ENOENT' });
    return;
  }
  const pending = await readFile(journal, 'utf8');
  if (failure === 'intent-sync') return;
  if (failure === 'replaced-directory') {
    await rename(oldest, `${oldest}.moved`);
    await mkdir(oldest);
  }
  if (failure === 'new-current') {
    await rm(path.join(fixture.config.remoteRoot, 'current'));
    await symlink(oldest, path.join(fixture.config.remoteRoot, 'current'));
    await writeFile(path.join(fixture.config.remoteRoot, 'deployment.json'), JSON.stringify(receipts[0]));
  }
  if (failure === 'changed-source') await writeFile(path.join(oldest, 'package.json'), 'changed');
  if (failure === 'changed-marker') await writeFile(path.join(oldest, mcpCommitMarker), '{}');
  const retried = await maintainMcpDeployment(update);
  assert.ok(retried.warnings.length > 0);
  assert.equal(await readFile(journal, 'utf8'), pending);
  for (const receipt of receipts) assert.ok(await lstat(receipt.appDirectory));
});
test('unknown, foreign-root and symlink cleanup intents are preserved without deleting any application', async (t) => {
  const { fixture, receipts } = await preservedHistory(t);
  const update = await updatePlan(t, fixture);
  const journal = path.join(fixture.config.remoteRoot, '.retention-cleanup.json');
  await maintainMcpDeployment(update, { remove: async () => { throw new Error('keep pending journal'); } });
  const original = await readFile(journal, 'utf8');
  const outside = path.join(fixture.root, 'outside-journal');
  await writeFile(outside, 'outside evidence');
  for (const kind of ['unknown', 'null', 'foreign-root', 'symlink']) await t.test(kind, async () => {
    await rm(journal);
    if (kind === 'symlink') await symlink(outside, journal);
    else {
      const value = JSON.parse(original);
      if (kind === 'foreign-root') { value.value.root = fixture.root; value.sha256 = sha256(JSON.stringify(value.value)); }
      await writeFile(journal, kind === 'unknown' ? '{}' : kind === 'null' ? 'null' : JSON.stringify(value));
    }
    const before = await lstat(journal);
    const result = await maintainMcpDeployment(update);
    assert.ok(result.warnings.length > 0);
    assert.equal((await lstat(journal)).ino, before.ino);
    for (const receipt of receipts) assert.ok(await lstat(receipt.appDirectory));
    assert.equal(await readFile(outside, 'utf8'), 'outside evidence');
  });
});
test('an intent whose application already disappeared is retired before cleaning the next candidate', async (t) => {
  const { fixture, receipts } = await preservedHistory(t);
  const update = await updatePlan(t, fixture);
  const oldest = receipts[0].appDirectory;
  const journal = path.join(fixture.config.remoteRoot, '.retention-cleanup.json');
  await maintainMcpDeployment(update, { remove: async (directory, options) => {
    await rm(directory, options);
    if (directory === oldest) throw new Error('completion acknowledgement failed');
  } });
  assert.ok(await lstat(journal));
  await assert.rejects(lstat(oldest), { code: 'ENOENT' });
  assert.ok(await lstat(receipts[1].appDirectory));
  const result = await maintainMcpDeployment(update);
  assert.deepEqual(result.warnings, []);
  await assert.rejects(lstat(journal), { code: 'ENOENT' });
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 3);
});
test('a missing predecessor does not occupy a recovery slot needed by an existing legacy application', async (t) => {
  const { fixture, receipts, markers } = await history(t, 4, { legacy: true });
  for (const index of [2, 3]) await writeFile(path.join(receipts[index].appDirectory, mcpCommitMarker), markers[index]);
  await rm(receipts[1].appDirectory, { recursive: true });
  const update = await updatePlan(t, fixture);
  const result = await maintainMcpDeployment(update);
  assert.ok(result.warnings.some((message) => message.includes('predecessor')));
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 3);
  assert.ok(await lstat(receipts[0].appDirectory));
});
async function legacyFailure(t, rolledBack = false) {
  const { fixture, shim, receipts } = await history(t, 1);
  const failed = await updatePlan(t, fixture);
  if (rolledBack) {
    await runMcpRemoteOperation('activate', failed, shim);
    await runMcpRemoteOperation('rollback', failed, shim);
  } else {
    await assert.rejects(runMcpRemoteOperation('activate', failed, { ...shim, install: async () => { throw new Error('기존 CLI의 전환 이전 설치 실패'); } }));
  }
  await rm(path.join(failed.incoming, 'attempt.json'));
  const next = await prepareMcpBundle(fixture.bundle);
  t.after(next.cleanup);
  const plan = await stageMcpFixture(fixture, next, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
  const receipt = receipts[0];
  const context = { ...plan, baselineVerified: { appDirectory: receipt.appDirectory, releaseId: receipt.releaseId, head: receipt.head } };
  return { fixture, failed, plan, context, receipt, failedApp: path.join(fixture.config.remoteRoot, 'apps', `${failed.metadata.releaseId}-${failed.owner}`) };
}
test('a committed incoming tail can be retried after its application has left the three-app history', async (t) => {
  const { fixture, receipts, plans } = await history(t, 4, { retainIncoming: true });
  const oldest = receipts[0];
  await assert.rejects(lstat(oldest.appDirectory), { code: 'ENOENT' });
  assert.ok(await lstat(plans[0].incoming));
  const update = await updatePlan(t, fixture);
  const result = await maintainMcpDeployment(update);
  assert.deepEqual(result.warnings, []);
  await assert.rejects(lstat(plans[0].incoming), { code: 'ENOENT' });
  assert.ok(await lstat(path.join(fixture.config.remoteRoot, 'archive/versions', oldest.releaseId)));
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 3);
});
test('a committed incoming tail preserves invalid identity, archive, and observable replacement evidence', async (t) => {
  const { fixture, receipts, plans } = await history(t, 4, { retainIncoming: true });
  const oldest = receipts[0];
  const incoming = plans[0].incoming;
  const update = await updatePlan(t, fixture);
  const manifestFile = path.join(fixture.config.remoteRoot, 'archive/versions', oldest.releaseId, 'knowledge-release.json');
  const files = [path.join(incoming, 'transaction.json'), path.join(incoming, 'attempt.json'), path.join(incoming, 'cleanup.json'), manifestFile, path.join(fixture.config.remoteRoot, 'deployment.json'), path.join(fixture.config.remoteRoot, '.deploy.lock/owner')];
  const contents = await Promise.all(files.map((file) => readFile(file, 'utf8')));
  const changeRecord = async (file, change, wrapped = false) => {
    const value = JSON.parse(await readFile(file, 'utf8'));
    change(wrapped ? value.value : value);
    if (wrapped) value.sha256 = sha256(JSON.stringify(value.value));
    await writeFile(file, JSON.stringify(value));
  };
  const changeReceipt = (change) => changeRecord(files[0], (state) => {
    const receipt = JSON.parse(state.nextReceipt);
    change(receipt);
    state.nextReceipt = JSON.stringify(receipt);
  });
  const cases = {
    'receipt-owner': () => changeReceipt((receipt) => { receipt.owner = update.owner; }),
    'receipt-root': () => changeReceipt((receipt) => { receipt.root = fixture.root; }),
    'receipt-head-suffix': () => changeReceipt((receipt) => { receipt.head = `${receipt.head.slice(0, -1)}0`; }),
    'receipt-release': () => changeReceipt((receipt) => { receipt.releaseId = receipts[1].releaseId; }),
    'receipt-app': () => changeReceipt((receipt) => { receipt.appDirectory = receipts[1].appDirectory; }),
    'receipt-corrupt': () => changeRecord(files[0], (state) => { state.nextReceipt = '{'; }),
    'transaction-phase': () => changeRecord(files[0], (state) => { state.phase = 'activated'; }),
    'attempt-head': () => changeRecord(files[1], (attempt) => { attempt.head = 'f'.repeat(40); }),
    'cleanup-owner': () => changeRecord(files[2], (cleanup) => { cleanup.owner = update.owner; }, true),
    'cleanup-root': () => changeRecord(files[2], (cleanup) => { cleanup.root = fixture.root; }, true),
    'cleanup-sha': () => changeRecord(files[2], (cleanup) => { cleanup.sha256 = '0'.repeat(64); }),
    'archive-missing': () => rm(manifestFile),
    'archive-corrupt': () => writeFile(manifestFile, '{'),
    'archive-head': () => changeRecord(manifestFile, (manifest) => { manifest.commit = 'f'.repeat(12); }),
    'archive-empty-commit': () => changeRecord(manifestFile, (manifest) => { manifest.commit = ''; }),
    'archive-release': () => changeRecord(manifestFile, (manifest) => { manifest.releaseId = receipts[1].releaseId; }),
    'archive-dirty': () => changeRecord(manifestFile, (manifest) => { manifest.dirty = true; }),
    'archive-missing-dirty': () => changeRecord(manifestFile, (manifest) => { delete manifest.dirty; }),
    'archive-channel': () => changeRecord(manifestFile, (manifest) => { manifest.channel = 'draft'; }),
    'app-without-marker': () => mkdir(oldest.appDirectory),
    'app-corrupt-marker': async () => { await mkdir(oldest.appDirectory); await writeFile(path.join(oldest.appDirectory, mcpCommitMarker), '{}'); },
    'app-symlink': () => symlink(receipts.at(-1).appDirectory, oldest.appDirectory),
    'receipt-reference': () => writeFile(files[4], JSON.stringify(oldest)),
  };
  for (const [name, change] of Object.entries(cases)) await t.test(name, async () => {
    try {
      await change();
      const result = await maintainMcpDeployment(update);
      assert.ok(result.warnings.length > 0);
      assert.ok(await lstat(incoming));
    } finally {
      await rm(oldest.appDirectory, { recursive: true, force: true });
      await Promise.all(files.map((file, index) => writeFile(file, contents[index])));
    }
  });
  const foreignOwner = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const foreign = path.join(fixture.config.remoteRoot, `.incoming-${foreignOwner}`);
  await t.test('unfinished-reference', async () => {
    await mkdir(foreign);
    try {
      await writeFile(path.join(foreign, 'owner'), foreignOwner);
      await writeFile(path.join(foreign, 'transaction.json'), JSON.stringify({ root: fixture.config.remoteRoot, owner: foreignOwner, phase: 'prepared', appDirectory: path.join(fixture.config.remoteRoot, 'apps', `${update.metadata.releaseId}-${foreignOwner}`), beforeCurrent: oldest.appDirectory }));
      const result = await maintainMcpDeployment(update);
      assert.ok(result.warnings.some((warning) => warning.includes('보호 참조')));
      assert.ok(await lstat(incoming));
    } finally { await rm(foreign, { recursive: true }); }
  });
  for (const change of ['incoming', 'archive', 'app', 'app-symlink', 'lock', 'current']) await t.test(`observed-${change}`, async () => {
    let observed = false;
    const current = path.join(fixture.config.remoteRoot, 'current');
    const previousCurrent = await readlink(current);
    try {
      const result = await maintainMcpDeployment(update, { beforeRemove: async (directory) => {
        if (directory !== incoming) return;
        observed = true;
        if (change === 'incoming') await changeReceipt((receipt) => { receipt.head = 'f'.repeat(40); });
        if (change === 'archive') await changeRecord(manifestFile, (manifest) => { manifest.appVersion = 'changed'; });
        if (change === 'app') await mkdir(oldest.appDirectory);
        if (change === 'app-symlink') await symlink(receipts.at(-1).appDirectory, oldest.appDirectory);
        if (change === 'lock') await writeFile(files[5], foreignOwner);
        if (change === 'current') { await rm(current); await symlink(oldest.appDirectory, current); }
      } });
      assert.equal(observed, true);
      assert.ok(result.warnings.length > 0);
      assert.ok(await lstat(incoming));
    } finally {
      await rm(oldest.appDirectory, { recursive: true, force: true });
      await Promise.all(files.map((file, index) => writeFile(file, contents[index])));
      await rm(current);
      await symlink(previousCurrent, current);
    }
  });
  const result = await maintainMcpDeployment(update);
  assert.deepEqual(result.warnings, []);
  await assert.rejects(lstat(incoming), { code: 'ENOENT' });
});
test('retention keeps three committed applications and every version archive after five deployments', async (t) => {
  const { fixture, shim, receipts } = await history(t);
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 3);
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'archive/versions'))).filter((name) => name !== 'index.json').length, 5);
  const archived = path.join(fixture.config.remoteRoot, 'archive/versions', receipts[0].releaseId, 'knowledge-release.json');
  assert.equal(sha256(await readFile(archived)), sha256(await readFile(path.join(fixture.archiveRoot, 'versions', receipts[0].releaseId, 'knowledge-release.json'))));
  const fingerprints = async (directory) => Object.fromEntries((await directoryEntries(directory)).map((entry) => [entry.name, sha256(entry.content)]));
  assert.deepEqual(await fingerprints(path.dirname(archived)), await fingerprints(path.join(fixture.archiveRoot, 'versions', receipts[0].releaseId)));
  // 과거 앱의 node_modules는 저장소로 향한 외부 링크입니다. 정리는 그 target을 따라가지 않습니다.
  assert.ok((await lstat(path.join(receipts[4].appDirectory, 'node_modules'))).isSymbolicLink());
  assert.ok((await readFile(path.join(fixture.repo, 'node_modules/zod/package.json'))).length > 0);
  const preserved = path.join(fixture.config.remoteRoot, 'archive/versions/.incoming-archive-evidence');
  await mkdir(preserved);
  await writeFile(path.join(preserved, 'keep'), 'archive evidence');
  const update = await updatePlan(t, fixture);
  shim.install = async () => { throw new Error('install failed before transaction'); };
  await assert.rejects(runMcpRemoteOperation('activate', update, shim), /복구했습니다/);
  const failedApp = path.join(fixture.config.remoteRoot, 'apps', `${update.metadata.releaseId}-${update.owner}`);
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 4);
  for (const receipt of receipts.slice(-3)) assert.ok(await readMcpCommit(fixture.config.remoteRoot, receipt.appDirectory));
  await assert.rejects(readFile(path.join(update.incoming, 'transaction.json')), { code: 'ENOENT' });
  const rolledBack = await runMcpRemoteOperation('rollback', update, shim);
  assert.equal(rolledBack.baseline.receipt.appDirectory, receipts[4].appDirectory);
  // finalize 이전에는 실패앱과 복구 증거를 유지합니다.
  assert.ok(await lstat(failedApp));
  await runMcpRemoteOperation('rollback-finalize', update, shim);
  await assert.rejects(lstat(failedApp), { code: 'ENOENT' });
  await assert.rejects(lstat(update.incoming), { code: 'ENOENT' });
  assert.equal(await readFile(path.join(preserved, 'keep'), 'utf8'), 'archive evidence');
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 3);
});
test('legacy current is adopted only after a matching verified baseline and unknown legacy remains with a warning', async (t) => {
  const { fixture, shim, receipts } = await history(t, 1);
  const current = receipts[0];
  await rm(path.join(current.appDirectory, mcpCommitMarker));
  const unknown = path.join(fixture.config.remoteRoot, 'apps/unknown-legacy');
  await mkdir(unknown);
  const update = await updatePlan(t, fixture);
  const context = { ...update, incoming: update.incoming };
  let result = await maintainMcpDeployment(context);
  assert.ok(result.warnings.some((message) => message.includes('legacy')));
  assert.equal(await readMcpCommit(fixture.config.remoteRoot, current.appDirectory), undefined);
  const server = await inspectMcpServer(fixture.config, { ...shim.preflight, lockOwner: update.owner });
  context.baselineVerified = { appDirectory: server.receipt.appDirectory, releaseId: server.receipt.releaseId, head: server.receipt.head };
  result = await maintainMcpDeployment(context);
  assert.equal((await readMcpCommit(fixture.config.remoteRoot, current.appDirectory)).kind, 'verified-legacy-current');
  assert.ok(result.warnings.some((message) => message.includes('unknown-legacy')));
  assert.ok(await lstat(unknown));
});
test('four identifiable legacy managed copies converge to three applications after a new commit without inventing healthy history', async (t) => {
  const { fixture, shim, receipts } = await history(t, 4, { legacy: true });
  const archive = path.join(fixture.config.remoteRoot, 'archive');
  await mkdir(path.join(archive, '.incoming-permanent'));
  await writeFile(path.join(archive, '.incoming-permanent/keep'), 'permanent archive');
  const update = await updatePlan(t, fixture);
  await runMcpRemoteOperation('activate', update, shim);
  const before = Object.fromEntries((await directoryEntries(archive)).map((entry) => [entry.name, sha256(entry.content)]));
  await runMcpRemoteOperation('commit', update, shim);
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 3);
  for (const receipt of receipts.slice(0, 2)) await assert.rejects(lstat(receipt.appDirectory), { code: 'ENOENT' });
  for (const receipt of receipts.slice(2)) {
    assert.ok(await lstat(receipt.appDirectory));
    assert.equal(await readMcpCommit(fixture.config.remoteRoot, receipt.appDirectory), undefined);
  }
  for (const [file, fingerprint] of Object.entries(before)) assert.equal(sha256(await readFile(path.join(archive, file))), fingerprint);
});
for (const normalCount of [2, 3]) test(`an older current and its ${normalCount}-app healthy chain take priority over newer legacy recovery candidates`, async (t) => {
  const { fixture, receipts, markers } = await history(t, 5, { legacy: true });
  const current = receipts[normalCount - 1];
  for (let index = 0; index < normalCount; index++) await writeFile(path.join(receipts[index].appDirectory, mcpCommitMarker), markers[index]);
  await rm(path.join(fixture.config.remoteRoot, 'current'));
  await symlink(current.appDirectory, path.join(fixture.config.remoteRoot, 'current'));
  await writeFile(path.join(fixture.config.remoteRoot, 'deployment.json'), JSON.stringify(current));
  const update = await updatePlan(t, fixture);
  await maintainMcpDeployment(update);
  const retained = new Set((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).map((name) => path.join(fixture.config.remoteRoot, 'apps', name)));
  assert.deepEqual(retained, new Set([...receipts.slice(0, normalCount), ...receipts.slice(normalCount === 2 ? -1 : receipts.length)].map((receipt) => receipt.appDirectory)));
  if (normalCount === 2) assert.equal(await readMcpCommit(fixture.config.remoteRoot, receipts[4].appDirectory), undefined);
});
test('legacy copies with damaged archives, source, or markers and namespace-only copies remain protected', async (t) => {
  const { fixture, shim, receipts } = await history(t, 5, { legacy: true });
  const update = await updatePlan(t, fixture);
  await runMcpRemoteOperation('activate', update, shim);
  const manifestFile = path.join(fixture.config.remoteRoot, 'archive/versions', receipts[0].releaseId, 'knowledge-release.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  await writeFile(manifestFile, JSON.stringify({ ...manifest, commit: 'ffffffffffff' }));
  await writeFile(path.join(receipts[1].appDirectory, mcpCommitMarker), '{}');
  await rm(path.join(receipts[2].appDirectory, 'mcp/cli.ts'));
  const unknown = path.join(fixture.config.remoteRoot, 'apps/20261001-120000-0123456789ab-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  await mkdir(unknown);
  const committed = await runMcpRemoteOperation('commit', update, shim);
  for (const directory of [...receipts.slice(0, 3).map((receipt) => receipt.appDirectory), unknown]) {
    assert.ok(await lstat(directory));
    assert.ok(committed.cleanupWarnings.some((warning) => warning.includes(directory)));
  }
  assert.equal(await readMcpCommit(fixture.config.remoteRoot, receipts[0].appDirectory), undefined);
  assert.equal(await readFile(manifestFile, 'utf8'), JSON.stringify({ ...manifest, commit: 'ffffffffffff' }));
});
test('a freshly verified legacy baseline retains three existing copies until the new deployment is committed', async (t) => {
  const { fixture, shim, receipts } = await history(t, 4, { legacy: true });
  const update = await updatePlan(t, fixture);
  const baseline = receipts.at(-1);
  await maintainMcpDeployment({ ...update, baselineVerified: { appDirectory: baseline.appDirectory, releaseId: baseline.releaseId, head: baseline.head } });
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 3);
  await runMcpRemoteOperation('activate', update, shim);
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 4);
  for (const receipt of receipts.slice(1)) assert.ok(await lstat(receipt.appDirectory));
  await runMcpRemoteOperation('commit', update, shim);
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 3);
});
for (const rolledBack of [false, true]) test(`a freshly verified current reclaims proven legacy ${rolledBack ? 'rolled-back' : 'pre-transaction'} failures with durable supersession evidence`, async (t) => {
  const { fixture, failed, context, receipt, failedApp } = await legacyFailure(t, rolledBack);
  const archive = path.join(fixture.config.remoteRoot, 'archive');
  const before = Object.fromEntries((await directoryEntries(archive)).map((entry) => [entry.name, sha256(entry.content)]));
  let observed = false;
  const result = await maintainMcpDeployment(context, { beforeRemove: async (directory) => {
    if (directory !== failedApp) return;
    observed = true;
    const terminal = JSON.parse(await readFile(path.join(failed.incoming, 'cleanup.json'), 'utf8')).value;
    const attempt = JSON.parse(await readFile(path.join(failed.incoming, 'attempt.json'), 'utf8'));
    assert.equal(terminal.kind, rolledBack ? 'superseded-rolled-back' : 'superseded-pre-transaction');
    assert.equal(terminal.anchor.appDirectory, receipt.appDirectory);
    assert.equal(attempt.phase, 'superseded');
    assert.equal(attempt.appDirectory, failedApp);
    assert.equal(await readMcpCommit(fixture.config.remoteRoot, failedApp), undefined);
  } });
  assert.equal(observed, true);
  assert.deepEqual(result.warnings, []);
  await assert.rejects(lstat(failedApp), { code: 'ENOENT' });
  await assert.rejects(lstat(failed.incoming), { code: 'ENOENT' });
  for (const [file, fingerprint] of Object.entries(before)) assert.equal(sha256(await readFile(path.join(archive, file))), fingerprint);
});
test('a superseded legacy failure retains its incoming evidence if application deletion fails and can be reclaimed later', async (t) => {
  const { failed, plan, context, failedApp } = await legacyFailure(t);
  const result = await maintainMcpDeployment(context, { remove: async (directory, options) => {
    if (directory === failedApp) throw new Error('legacy app deletion denied');
    await rm(directory, options);
  } });
  assert.ok(result.warnings.some((warning) => warning.includes('deletion denied')));
  assert.ok(result.preserveIncoming.includes(failed.incoming));
  assert.ok(await lstat(failedApp));
  assert.equal(JSON.parse(await readFile(path.join(failed.incoming, 'attempt.json'), 'utf8')).phase, 'superseded');
  assert.equal(JSON.parse(await readFile(path.join(failed.incoming, 'cleanup.json'), 'utf8')).value.kind, 'superseded-pre-transaction');
  await maintainMcpDeployment(plan);
  await assert.rejects(lstat(failedApp), { code: 'ENOENT' });
  await assert.rejects(lstat(failed.incoming), { code: 'ENOENT' });
});
for (const uncertainty of ['unverified-anchor', 'missing-baseline', 'owner-only', 'metadata-head', 'prepared', 'activated', 'corrupt-transaction', 'attempt-owner', 'rolled-back-attempt-owner']) test(`legacy failure evidence with ${uncertainty} remains protected`, async (t) => {
  const { failed, plan, context, failedApp, receipt } = await legacyFailure(t, ['prepared', 'activated', 'corrupt-transaction', 'rolled-back-attempt-owner'].includes(uncertainty));
  if (uncertainty === 'missing-baseline') await rm(path.join(failed.incoming, 'baseline.json'));
  if (uncertainty === 'owner-only') for (const name of ['baseline.json', 'release.json']) await rm(path.join(failed.incoming, name));
  if (uncertainty === 'metadata-head') {
    const file = path.join(failed.incoming, 'release.json');
    const metadata = JSON.parse(await readFile(file, 'utf8'));
    await writeFile(file, JSON.stringify({ ...metadata, head: 'f'.repeat(40) }));
  }
  if (['prepared', 'activated'].includes(uncertainty)) {
    const file = path.join(failed.incoming, 'transaction.json');
    const state = JSON.parse(await readFile(file, 'utf8'));
    await writeFile(file, JSON.stringify({ ...state, phase: uncertainty }));
  }
  if (uncertainty === 'corrupt-transaction') await writeFile(path.join(failed.incoming, 'transaction.json'), '{');
  if (uncertainty.endsWith('attempt-owner')) await writeFile(path.join(failed.incoming, 'attempt.json'), JSON.stringify({ owner: plan.owner, root: plan.config.remoteRoot, releaseId: failed.metadata.releaseId, head: failed.metadata.head, appDirectory: failedApp, beforeCurrent: receipt.appDirectory, phase: 'installing' }));
  await maintainMcpDeployment(uncertainty === 'unverified-anchor' ? plan : context);
  assert.ok(await lstat(failedApp));
  assert.ok(await lstat(failed.incoming));
  await assert.rejects(lstat(path.join(failed.incoming, 'cleanup.json')), { code: 'ENOENT' });
});
for (const failure of ['remove', 'concurrent', 'current-replaced', 'symlink-replaced', 'corrupt-marker', 'escaping-marker', 'legacy-archive-changed']) test(`retention preserves observable ${failure} evidence and commit returns cleanup warnings`, async (t) => {
  const { fixture, shim, receipts } = await history(t, 3);
  const oldest = receipts[0].appDirectory;
  const outside = path.join(fixture.root, 'outside-retention');
  await mkdir(outside);
  await writeFile(path.join(outside, 'keep'), 'external target');
  const update = await updatePlan(t, fixture);
  await runMcpRemoteOperation('activate', update, shim);
  if (failure === 'legacy-archive-changed') await rm(path.join(oldest, mcpCommitMarker));
  if (failure === 'corrupt-marker') await writeFile(path.join(oldest, mcpCommitMarker), '{}');
  if (failure === 'escaping-marker') {
    const marker = JSON.parse(await readFile(path.join(oldest, mcpCommitMarker), 'utf8'));
    marker.value.predecessor = fixture.root;
    marker.sha256 = sha256(JSON.stringify(marker.value));
    await writeFile(path.join(oldest, mcpCommitMarker), JSON.stringify(marker));
  }
  const cleanup = failure === 'remove' ? { remove: async (directory, options) => {
    if (directory === oldest) throw new Error('cleanup denied');
    await rm(directory, options);
  } } : failure === 'concurrent' ? { beforeRemove: async (directory) => { if (directory === oldest) await writeFile(path.join(directory, 'changed'), 'concurrent'); } } : failure === 'current-replaced' ? { beforeRemove: async () => {
    const current = path.join(fixture.config.remoteRoot, 'current');
    const temporary = `${current}.replaced`;
    await symlink(await readlink(current), temporary);
    await rename(temporary, current);
  } } : failure === 'legacy-archive-changed' ? { beforeRemove: async (directory) => {
    if (directory !== oldest) return;
    const file = path.join(fixture.config.remoteRoot, 'archive/versions', receipts[0].releaseId, 'knowledge-release.json');
    const manifest = JSON.parse(await readFile(file, 'utf8'));
    await writeFile(file, JSON.stringify({ ...manifest, dirty: true }));
  } } : failure === 'symlink-replaced' ? { beforeRemove: async (directory) => {
    if (directory !== oldest) return;
    await rename(directory, `${directory}.moved`);
    await symlink(outside, directory);
  } } : {};
  const committed = await runMcpRemoteOperation('commit', update, { ...shim, cleanup });
  assert.ok(committed.cleanupWarnings.length > 0);
  assert.ok(await lstat(oldest));
  assert.equal(await readlink(path.join(fixture.config.remoteRoot, 'current')), committed.appDirectory);
  assert.equal((await shim.state()).active, 'active');
  assert.equal(await readFile(path.join(outside, 'keep'), 'utf8'), 'external target');
  if (failure === 'remove') await assert.rejects(lstat(update.incoming), { code: 'ENOENT' });
});
for (const legacy of [false, true]) test(`a live transaction protects its real ${legacy ? 'legacy' : 'committed'} rollback predecessor outside the normal three-app chain`, async (t) => {
  const { fixture, shim, receipts } = await history(t, 3, { legacy });
  const update = await updatePlan(t, fixture);
  const owner = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const incoming = path.join(fixture.config.remoteRoot, `.incoming-${owner}`);
  await mkdir(incoming);
  await writeFile(path.join(incoming, 'owner'), owner);
  await writeFile(path.join(incoming, 'transaction.json'), JSON.stringify({ root: fixture.config.remoteRoot, owner, appDirectory: path.join(fixture.config.remoteRoot, 'apps', `${update.metadata.releaseId}-${owner}`), beforeCurrent: receipts[0].appDirectory, phase: 'prepared' }));
  await runMcpRemoteOperation('activate', update, shim);
  await runMcpRemoteOperation('commit', update, shim);
  assert.ok(await lstat(receipts[0].appDirectory));
  assert.equal((await readdir(path.join(fixture.config.remoteRoot, 'apps'))).length, 4);
  assert.ok(await lstat(incoming));
});
test('a terminal commit marker write failure fails closed with the transaction and lock preserved', async (t) => {
  const { fixture, shim, plan } = await scenario(t);
  const activated = await runMcpRemoteOperation('activate', plan, shim);
  await mkdir(path.join(activated.appDirectory, mcpCommitMarker));
  await assert.rejects(runMcpRemoteOperation('commit', plan, shim), /control 기록/);
  assert.equal(JSON.parse(await readFile(path.join(plan.incoming, 'transaction.json'), 'utf8')).phase, 'committed');
  assert.equal(await readFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), 'utf8'), plan.owner);
  assert.equal(await readlink(path.join(fixture.config.remoteRoot, 'current')), activated.appDirectory);
});
test('foreign incoming control symlinks and unknown ownership preserve targets and unfinished attempts', async (t) => {
  const { fixture, shim, receipts } = await history(t, 1);
  const update = await updatePlan(t, fixture);
  const foreign = path.join(fixture.config.remoteRoot, '.incoming-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  await mkdir(foreign);
  const outside = path.join(fixture.root, 'outside-owner');
  await writeFile(outside, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  await symlink(outside, path.join(foreign, 'owner'));
  const appLink = path.join(fixture.config.remoteRoot, 'apps/linked-app');
  await symlink(receipts[0].appDirectory, appLink);
  const result = await maintainMcpDeployment(update);
  assert.ok(result.warnings.some((message) => message.includes('owner')));
  assert.ok(result.warnings.some((message) => message.includes('linked-app')));
  assert.equal(await readFile(outside, 'utf8'), 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  shim.install = async () => { throw new Error('uncertain external verification'); };
  await assert.rejects(runMcpRemoteOperation('activate', update, shim));
  assert.ok(await readFile(path.join(update.incoming, 'attempt.json')));
  assert.equal(await readFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), 'utf8'), update.owner);
});
test('verified failed-install leftovers are reclaimed by the next owner while unresolved leftovers remain protected', async (t) => {
  const { fixture, shim } = await history(t, 1);
  const failed = await updatePlan(t, fixture, 8);
  shim.install = async () => { throw new Error('installation failed'); };
  await assert.rejects(runMcpRemoteOperation('activate', failed, shim));
  const failedApp = path.join(fixture.config.remoteRoot, 'apps', `${failed.metadata.releaseId}-${failed.owner}`);
  const finalized = await runMcpRemoteOperation('rollback-finalize', failed, { ...shim, cleanup: { remove: async () => { throw new Error('cleanup denied'); } } });
  assert.ok(finalized.cleanupWarnings.length > 0);
  assert.ok(await lstat(failedApp));
  assert.ok(await lstat(failed.incoming));
  const next = await prepareMcpBundle(fixture.bundle);
  t.after(next.cleanup);
  const nextPlan = await stageMcpFixture(fixture, next, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
  const unresolved = path.join(fixture.config.remoteRoot, '.incoming-dddddddd-dddd-4ddd-8ddd-dddddddddddd');
  const unresolvedApp = path.join(fixture.config.remoteRoot, 'apps', `${nextPlan.metadata.releaseId}-dddddddd-dddd-4ddd-8ddd-dddddddddddd`);
  await mkdir(unresolved);
  await writeFile(path.join(unresolved, 'owner'), 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');
  await mkdir(unresolvedApp);
  await writeFile(path.join(unresolved, 'attempt.json'), JSON.stringify({ owner: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', root: fixture.config.remoteRoot, appDirectory: unresolvedApp, phase: 'installing' }));
  await maintainMcpDeployment(nextPlan);
  await assert.rejects(lstat(failedApp), { code: 'ENOENT' });
  await assert.rejects(lstat(failed.incoming), { code: 'ENOENT' });
  assert.ok(await lstat(unresolvedApp));
  assert.ok(await lstat(unresolved));
});
test('Given an initial server, When activated and committed, Then exact receipt is returned and the lock is released', async (t) => {
  const { fixture, bundle, shim, plan } = await scenario(t);
  const activated = await runMcpRemoteOperation('activate', plan, shim);
  assert.equal(activated.releaseId, bundle.metadata.releaseId);
  assert.deepEqual(activated.packageManager, { command: 'pnpm', prefix: [], version: '12.16.1' });
  assert.equal(await readlink(path.join(fixture.config.remoteRoot, 'current')), activated.appDirectory);
  assert.equal((await shim.state()).active, 'active');
  assert.equal((await shim.state()).enabled, 'enabled');
  assert.equal(await readFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner'), 'utf8'), plan.owner);
  assert.deepEqual(await runMcpRemoteOperation('commit', plan, shim), activated);
  await assert.rejects(readFile(path.join(fixture.config.remoteRoot, '.deploy.lock/owner')), { code: 'ENOENT' });
  await assert.rejects(lstat(plan.incoming), { code: 'ENOENT' });
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
  plan.packageManager = { command: '/untrusted/command', prefix: ['install'], version: '12.16.1' };
  plan.metadata.packageManager = first.packageManager;
  await shim.state({ pnpmPresent: true, corepackPresent: false });
  const install = shim.install;
  let selected;
  shim.install = async (directory, selection) => { selected = selection; await install(directory); };
  const activated = await runMcpRemoteOperation('activate', plan, shim);
  assert.deepEqual(selected, { command: 'pnpm', prefix: [], version: '12.16.1' });
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
