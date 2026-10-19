import assert from 'node:assert/strict';
import { once } from 'node:events';
import { access, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import test from 'node:test';
import { createArtifact } from '../deploy-artifact.mjs';
import { validateBuild } from '../deploy-build.mjs';
import { runDeployment } from '../deploy-playground.mjs';
import { runOperation } from '../deploy-operations.mjs';
import { deploymentFixture } from './helpers/deploy-fixture.mjs';
import { activateRelease } from '../deploy-activation.mjs';
import { cleanupReleases } from '../deploy-cleanup.mjs';

async function liveFixture(t) {
  const state = await deploymentFixture(t);
  await rm(path.join(state.workspace, 'bin/curl'));
  const controls = { staleMetadata: false };
  const server = createServer(async (request, response) => {
    try {
      const route = new URL(request.url, 'http://127.0.0.1').pathname;
      if (route === '/health') { response.end('ok\n'); return; }
      if (route === '/release.json' && controls.beforeMetadata) await controls.beforeMetadata();
      if (controls.staleMetadata && route === '/release.json') { response.end('{"release":"stale"}'); return; }
      const root = path.join(state.base, 'current');
      const file = route === '/' ? path.join(root, 'index.html') : path.join(root, route.slice(1));
      try { response.end(await readFile(file)); }
      catch { response.end(await readFile(path.join(root, 'index.html'))); }
    } catch { response.statusCode = 500; response.end('failed'); }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); });
  const config = { ...state.config, host: '127.0.0.1', sshPort: server.address().port, url: `http://127.0.0.1:${server.address().port}` };
  const dependencies = { config, interactive: false, run: state.run, authenticate: async () => {}, log() {} };
  return { ...state, config, controls, dependencies };
}

test('real localhost HTTP and system curl exercise deploy, status, rollback and cleanup', async (t) => {
  const state = await liveFixture(t);
  const context = { commit: 'abcdef012345', dirty: true, packages: { '@owp/core': '6.1.0' }, fingerprint: 'fixture' };
  let artifact;
  let builds = 0;
  const result = await runDeployment({ assumeVpn: true }, {
    ...state.dependencies, context: async () => context,
    run: async (command, args, options) => {
      if (command !== 'pnpm') return state.run(command, args, options);
      assert.deepEqual(args, ['build']);
      builds++;
      await writeFile(path.join(state.directory, 'assets/app.js'), 'console.log("fresh build")');
    },
    validate: () => validateBuild(state.directory),
    pack: async () => { artifact = await createArtifact({ directory: state.directory, context }); return artifact; },
  });
  assert.equal(builds, 1);
  assert.equal(result.stage, 'deployed');
  assert.equal(await state.current(), `releases/${artifact.release}`);
  await assert.rejects(access(artifact.archive), { code: 'ENOENT' });
  const beforeStatus = await readdir(state.base, { recursive: true });
  const status = await runOperation({ action: 'status', assumeVpn: true }, state.dependencies);
  assert.equal(status.healthy, true);
  assert.equal(status.metadata.release, artifact.release);
  state.controls.staleMetadata = true;
  assert.equal((await runOperation({ action: 'status', assumeVpn: true }, state.dependencies)).healthy, false);
  state.controls.staleMetadata = false;
  assert.deepEqual(await readdir(state.base, { recursive: true }), beforeStatus);
  const rolledBack = await runOperation({ action: 'rollback', assumeVpn: true, yes: true }, state.dependencies);
  assert.equal(rolledBack.current, 'initial');
  assert.equal(await state.current(), 'releases/initial');
  const cleanup = await runOperation({ action: 'cleanup', assumeVpn: true, dryRun: true }, state.dependencies);
  assert.deepEqual(cleanup.removed, []);
  assert.equal((await runOperation({ action: 'status', assumeVpn: true }, state.dependencies)).healthy, true);
});

test('real HTTP 200 with incorrect new metadata triggers verified automatic rollback', async (t) => {
  const state = await liveFixture(t);
  state.controls.staleMetadata = true;
  const prepared = await state.prepare();
  await assert.rejects(activateRelease(state.config, prepared.artifact, prepared.uploaded, prepared.staged, {
    interactive: false, run: state.run, verifyHealth: true,
  }), /OWP_AUTO_ROLLBACK_OK initial/);
  assert.equal(await state.current(), 'releases/initial');
});

test('the deployment lock stays held while the real HTTP validation is pending', async (t) => {
  const state = await liveFixture(t);
  const prepared = await state.prepare();
  let observed;
  const pending = new Promise((resolve) => { observed = resolve; });
  let resume;
  const gate = new Promise((resolve) => { resume = resolve; });
  state.controls.beforeMetadata = async () => { observed(); await gate; };
  const activation = activateRelease(state.config, prepared.artifact, prepared.uploaded, prepared.staged, { interactive: false, run: state.run, verifyHealth: true });
  try {
    await Promise.race([pending, activation.then(() => { throw new Error('HTTP validation did not reach the test gate'); })]);
    await assert.rejects(cleanupReleases(state.config, { interactive: false, run: state.run, dryRun: true }), /다른 배포가 진행 중/);
  } finally { resume(); }
  await activation;
  assert.equal(await state.current(), `releases/${prepared.artifact.release}`);
});
