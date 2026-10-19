import assert from 'node:assert/strict';
import { access, mkdir, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { cleanupReleases } from '../deploy-cleanup.mjs';
import { deploymentFixture } from './helpers/deploy-fixture.mjs';

async function cleanupFixture(t) {
  const state = await deploymentFixture(t);
  const deployed = await state.deploy();
  const names = [];
  for (let day = 1; day <= 9; day++) {
    const name = `202610${String(day).padStart(2, '0')}-030000-abcdef012345`;
    names.push(name);
    await mkdir(path.join(state.base, 'releases', name));
    await writeFile(path.join(state.base, 'releases', name, 'index.html'), 'old release');
    await writeFile(path.join(state.base, '.deploy-state/healthy', `${name}.sha256`), 'recorded healthy');
  }
  const cleanup = (dryRun = false) => cleanupReleases(state.config, { interactive: true, run: state.run, dryRun });
  return { ...state, deployed, names, cleanup };
}

test('cleanup keeps the five newest normal releases plus current, previous, protected and initial', async (t) => {
  const state = await cleanupFixture(t);
  const previous = state.names[0];
  const protectedRelease = state.names[1];
  await writeFile(path.join(state.base, '.deploy-state/previous'), previous);
  await writeFile(path.join(state.base, '.deploy-state/protected', protectedRelease), 'keep');
  const plan = await state.cleanup(true);
  assert.deepEqual(plan.candidates, state.names.slice(2, 5).reverse());
  assert.deepEqual(plan.removed, []);
  for (const name of state.names) await access(path.join(state.base, 'releases', name));
  const result = await state.cleanup();
  assert.deepEqual(result.removed, plan.candidates);
  for (const name of [previous, protectedRelease, ...state.names.slice(5), 'initial', state.deployed.artifact.release]) await access(path.join(state.base, 'releases', name));
  for (const name of result.removed) await assert.rejects(access(path.join(state.base, 'releases', name)), { code: 'ENOENT' });
  assert.equal(await state.current(), `releases/${state.deployed.artifact.release}`);
});

test('cleanup never follows a release symlink or touches incoming and unknown directories', async (t) => {
  const state = await cleanupFixture(t);
  const outside = path.join(state.workspace, 'outside');
  await mkdir(outside);
  await writeFile(path.join(outside, 'keep'), 'protected');
  const name = state.names[0];
  await rm(path.join(state.base, 'releases', name), { recursive: true });
  await symlink(outside, path.join(state.base, 'releases', name));
  for (const folder of ['.incoming-in-flight', 'unknown', '20260901-010000-abcdef012345']) await mkdir(path.join(state.base, 'releases', folder));
  await state.cleanup();
  await access(path.join(outside, 'keep'));
  for (const folder of [name, '.incoming-in-flight', 'unknown', '20260901-010000-abcdef012345']) await access(path.join(state.base, 'releases', folder));
});

test('cleanup refuses a foreign lock without removing it', async (t) => {
  const state = await cleanupFixture(t);
  const lock = path.join(state.base, '.deploy-lock');
  await mkdir(lock);
  await writeFile(path.join(lock, 'owner'), 'other');
  await assert.rejects(state.cleanup(), /다른 배포가 진행 중/);
  assert.deepEqual(await readdir(lock), ['owner']);
});

test('cleanup only removes names approved in the displayed plan', async (t) => {
  const state = await cleanupFixture(t);
  const plan = await state.cleanup(true);
  const approved = plan.candidates.slice(0, 1);
  const result = await cleanupReleases(state.config, { interactive: true, run: state.run, approved });
  assert.deepEqual(result.removed, approved);
  for (const name of plan.candidates.slice(1)) await access(path.join(state.base, 'releases', name));
});

test('successful deployment removes only its own temporary upload and keeps private history', async (t) => {
  const state = await deploymentFixture(t);
  const { artifact, uploaded, result } = await state.deploy();
  await assert.rejects(access(path.dirname(uploaded.archive)), { code: 'ENOENT' });
  await access(result.record);
  await access(path.join(state.base, 'releases', artifact.release, 'index.html'));
});
