import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { deploymentFixture } from './helpers/deploy-fixture.mjs';
import { activateRelease } from '../deploy-activation.mjs';

test('deployment verifies HTTP file contents and preserves previous healthy release', async (t) => {
  const state = await deploymentFixture(t);
  const { artifact } = await state.deploy();
  assert.equal(await state.current(), `releases/${artifact.release}`);
  assert.equal((await readFile(path.join(state.base, '.deploy-state/previous'), 'utf8')).trim(), 'initial');
  await access(path.join(state.base, '.deploy-state/healthy', `${artifact.release}.sha256`));
  await access(path.join(state.base, '.deploy-state/healthy/initial.sha256'));
  await assert.rejects(access(path.join(state.base, '.deploy-lock')), { code: 'ENOENT' });
});

for (const route of ['/health', '/', '/release.json', '/deploy-manifest.json', '/assets/app.js', '/assets/app.css', '/robots.txt']) {
  test(`HTTP failure on ${route} restores and rechecks the previous release`, async (t) => {
    const state = await deploymentFixture(t);
    state.controls.fail = route;
    await assert.rejects(state.deploy(), /OWP_AUTO_ROLLBACK_OK initial/);
    assert.equal(await state.current(), 'releases/initial');
    await assert.rejects(access(path.join(state.base, '.deploy-lock')), { code: 'ENOENT' });
  });
}

test('HTTP 200 with stale HTML triggers automatic rollback', async (t) => {
  const state = await deploymentFixture(t);
  state.controls.stale = true;
  await assert.rejects(state.deploy(), /HTTP 파일 내용 불일치/);
  assert.equal(await state.current(), 'releases/initial');
});

for (const control of ['containerDown', 'badMount']) {
  test(`${control} aborts before current changes`, async (t) => {
    const state = await deploymentFixture(t);
    state.controls[control] = true;
    await assert.rejects(state.deploy(), /서버 배포 사전 검사/);
    assert.equal(await state.current(), 'releases/initial');
  });
}

test('failed restoration health stops with both releases and recovery files preserved', async (t) => {
  const state = await deploymentFixture(t);
  state.controls.fail = '/';
  state.controls.failOnRestore = true;
  const prepared = await state.prepare();
  await assert.rejects(activateRelease(state.config, prepared.artifact, prepared.uploaded, prepared.staged, {
    interactive: true, run: state.run, verifyHealth: true,
  }), /이전 current로 복구했지만 HTTP 검증에 실패/);
  assert.equal(await state.current(), 'releases/initial');
  await access(path.join(state.base, 'releases', prepared.artifact.release));
  await access(prepared.uploaded.archive);
});

test('a lost success receipt preserves the committed deployment and its private history', async (t) => {
  const state = await deploymentFixture(t);
  const prepared = await state.prepare();
  state.controls.truncateReceipt = true;
  await assert.rejects(activateRelease(state.config, prepared.artifact, prepared.uploaded, prepared.staged, {
    interactive: true, run: state.run, verifyHealth: true,
  }), /HTTP 검증 완료 응답이 없습니다/);
  assert.equal(await state.current(), `releases/${prepared.artifact.release}`);
  await access(path.join(state.base, '.deploy-state/history', `${prepared.artifact.release}.json`));
});
