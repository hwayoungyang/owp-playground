import assert from 'node:assert/strict';
import { access, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { checkServerReady } from '../deploy-server.mjs';
import { readReleaseStatus } from '../deploy-status.mjs';
import { rollbackRelease } from '../deploy-rollback.mjs';
import { parseOperationOptions, runOperation } from '../deploy-operations.mjs';
import { deploymentFixture } from './helpers/deploy-fixture.mjs';

test('server preflight and initial status are read-only', async (t) => {
  const state = await deploymentFixture(t);
  const before = await readdir(state.base, { recursive: true });
  await checkServerReady(state.config, { interactive: true, run: state.run });
  const status = await readReleaseStatus(state.config, { interactive: true, run: state.run });
  assert.deepEqual(status, { current: 'initial', previous: null, running: true, locked: false, metadata: null });
  assert.deepEqual(await readdir(state.base, { recursive: true }), before);
  await assert.rejects(access(path.join(state.base, '.deploy-state')), { code: 'ENOENT' });
});

test('manual rollback verifies the previous release and supports rolling forward again', async (t) => {
  const state = await deploymentFixture(t);
  const { artifact } = await state.deploy();
  const status = await readReleaseStatus(state.config, { interactive: true, run: state.run });
  assert.equal(status.current, artifact.release);
  assert.equal(status.previous, 'initial');
  assert.equal(status.metadata.packages['@owp/core'], '6.1.0');
  const result = await rollbackRelease(state.config, status, { interactive: true, run: state.run });
  assert.deepEqual(result, { current: 'initial', previous: artifact.release });
  assert.equal(await state.current(), 'releases/initial');
  const restored = await readReleaseStatus(state.config, { interactive: true, run: state.run });
  await rollbackRelease(state.config, restored, { interactive: true, run: state.run });
  assert.equal(await state.current(), `releases/${artifact.release}`);
  await assert.rejects(access(path.join(state.base, '.deploy-lock')), { code: 'ENOENT' });
});

test('changed rollback files abort before switching current', async (t) => {
  const state = await deploymentFixture(t);
  const { artifact } = await state.deploy();
  const status = await readReleaseStatus(state.config, { interactive: true, run: state.run });
  await writeFile(path.join(state.base, 'releases/initial/robots.txt'), 'tampered');
  await assert.rejects(rollbackRelease(state.config, status, { interactive: true, run: state.run }), /마지막 검증 이후 변경/);
  assert.equal(await state.current(), `releases/${artifact.release}`);
});

test('an unhealthy rollback target restores the original current and verifies it again', async (t) => {
  const state = await deploymentFixture(t);
  const { artifact } = await state.deploy();
  const status = await readReleaseStatus(state.config, { interactive: true, run: state.run });
  state.controls.fail = '/health';
  state.controls.failureRelease = 'initial';
  await assert.rejects(rollbackRelease(state.config, status, { interactive: true, run: state.run }), new RegExp(`OWP_AUTO_ROLLBACK_OK ${artifact.release}`));
  assert.equal(await state.current(), `releases/${artifact.release}`);
  await assert.rejects(access(path.join(state.base, '.deploy-lock')), { code: 'ENOENT' });
});

test('rollback can recover a current release whose metadata or assets are damaged', async (t) => {
  const state = await deploymentFixture(t);
  const { artifact } = await state.deploy();
  await writeFile(path.join(state.base, 'releases', artifact.release, 'release.json'), '{broken');
  const status = await readReleaseStatus(state.config, { interactive: true, run: state.run, includeMetadata: false });
  await rollbackRelease(state.config, status, { interactive: true, run: state.run });
  assert.equal(await state.current(), 'releases/initial');
  const after = await readReleaseStatus(state.config, { interactive: true, run: state.run });
  assert.equal(after.previous, null);
});

test('a stale rollback approval is rejected after another deployment', async (t) => {
  const state = await deploymentFixture(t);
  await state.deploy();
  const stale = await readReleaseStatus(state.config, { interactive: true, run: state.run });
  const latest = await state.deploy();
  await assert.rejects(rollbackRelease(state.config, stale, { interactive: true, run: state.run }), /승인 후 current가 변경/);
  assert.equal(await state.current(), `releases/${latest.artifact.release}`);
});

test('status surfaces container failure and retains the recorded active release', async (t) => {
  const state = await deploymentFixture(t);
  state.controls.containerDown = true;
  const status = await readReleaseStatus(state.config, { interactive: true, run: state.run });
  assert.equal(status.running, false);
  assert.equal(status.current, 'initial');
});

test('rollback CLI asks approval for the concrete target and cancels without mutation', async () => {
  const calls = [];
  const dependencies = {
    interactive: true, confirm: async () => {}, checkPort: async () => {}, authenticate: async () => {},
    inspect: async () => ({ current: '20261020-030000-0123456789ab', previous: 'initial', locked: false }),
    ask: async () => { calls.push('ask'); return false; }, rollback: async () => { calls.push('mutate'); }, log() {},
  };
  await assert.rejects(runOperation({ action: 'rollback' }, dependencies), /rollback을 취소/);
  assert.deepEqual(calls, ['ask']);
  dependencies.interactive = false;
  await assert.rejects(runOperation({ action: 'rollback' }, dependencies), /--yes/);
  assert.deepEqual(calls, ['ask']);
});

test('rollback CLI rejects an empty history before asking approval', async () => {
  await assert.rejects(runOperation({ action: 'rollback', yes: true }, {
    interactive: false, confirm: async () => {}, checkPort: async () => {}, authenticate: async () => {},
    inspect: async () => ({ current: 'initial', previous: null, locked: false }), log() {},
    rollback: async () => assert.fail('must not mutate'),
  }), /이전 정상 릴리스/);
});

test('status reports failed health without triggering rollback or writes', async () => {
  const output = [];
  const result = await runOperation({ action: 'status' }, {
    interactive: false, confirm: async () => {}, checkPort: async () => {}, authenticate: async () => {},
    inspect: async () => ({ current: 'initial', previous: null, running: true, locked: false, metadata: null }),
    checkHealth: async () => { throw new Error('offline'); }, rollback: async () => assert.fail('must not mutate'), log: (value) => output.push(value),
  });
  assert.equal(result.healthy, false);
  assert.match(output.join('\n'), /Health: FAIL/);
});

test('operation options reject unknown actions, positional targets and status approvals', () => {
  assert.equal(parseOperationOptions(['rollback', '--yes', '--assume-vpn']).yes, true);
  assert.throws(() => parseOperationOptions(['status', '--yes']));
  assert.throws(() => parseOperationOptions(['rollback', '/outside']));
  assert.throws(() => parseOperationOptions(['unknown']));
});
