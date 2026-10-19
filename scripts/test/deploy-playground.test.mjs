import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseDeployOptions, runDeployment, runCommand } from '../deploy-playground.mjs';

const cli = fileURLToPath(new URL('../deploy-playground.mjs', import.meta.url));
const execute = promisify(execFile);
const build = { files: 4, assets: 2, bytes: 1234 };
const context = { commit: 'a1b2c3d4e5f6', fingerprint: 'stable-inputs', packages: {}, dirty: true };
const uploaded = { archive: '/home/owp-playground/releases/.incoming-example/artifact.tar.gz' };
const staged = { directory: '/home/owp-playground/releases/.incoming-example/content', files: 7 };
const activated = { previous: 'initial', release: '20261020-023000-a1b2c3d4e5f6' };

function scenario(failure) {
  const calls = [];
  const record = (name, value) => async (...args) => {
    calls.push({ name, args });
    if (failure === name) throw new Error(`${name} failed`);
    return value;
  };
  const artifact = { release: '20261020-023000-a1b2c3d4e5f6', sha256: 'a'.repeat(64), bytes: 512, cleanup: record('cleanup') };
  return {
    calls,
    dependencies: {
      interactive: false,
      confirm: record('vpn'),
      checkPort: record('tcp'),
      checkHealth: record('http'),
      authenticate: record('ssh'),
      ready: record('ready'),
      run: record('build'),
      validate: record('validate', build),
      context: async () => context,
      pack: record('package', artifact),
      transfer: record('upload', uploaded),
      stage: record('stage', staged),
      activate: record('activate', activated),
      log() {},
    },
  };
}

test('runs a fresh build through staging, atomic activation and HTTP verification', async () => {
  const { calls, dependencies } = scenario();
  const result = await runDeployment({ assumeVpn: true }, dependencies);
  assert.deepEqual(calls.map((call) => call.name), ['vpn', 'tcp', 'http', 'ssh', 'ready', 'build', 'validate', 'package', 'upload', 'stage', 'activate', 'cleanup']);
  assert.deepEqual(calls.find((call) => call.name === 'build').args, ['pnpm', ['build']]);
  assert.deepEqual(calls[0].args, [{ interactive: false, assumeVpn: true }]);
  assert.deepEqual(result, { stage: 'deployed', build, uploaded, staged, activated });
  assert.equal(calls.find((call) => call.name === 'activate').args.at(-1).verifyHealth, true);
});

for (const failure of ['vpn', 'tcp', 'http', 'ssh', 'ready', 'build', 'validate', 'package', 'upload', 'stage', 'activate']) {
  test(`stops all subsequent work when ${failure} fails`, async () => {
    const { calls, dependencies } = scenario(failure);
    await assert.rejects(runDeployment({ assumeVpn: true }, dependencies), new RegExp(`${failure} failed`));
    const stages = ['vpn', 'tcp', 'http', 'ssh', 'ready', 'build', 'validate', 'package', 'upload', 'stage', 'activate'];
    const expected = stages.slice(0, stages.indexOf(failure) + 1);
    if (['upload', 'stage', 'activate'].includes(failure)) expected.push('cleanup');
    assert.deepEqual(calls.map((call) => call.name), expected);
  });
}

test('preflight-only performs authentication without starting the build', async () => {
  const { calls, dependencies } = scenario();
  assert.deepEqual(await runDeployment({ preflightOnly: true }, dependencies), { stage: 'preflight-checked' });
  assert.deepEqual(calls.map((call) => call.name), ['vpn', 'tcp', 'http', 'ssh', 'ready']);
});

test('parses explicit approvals and rejects unsupported options or targets', () => {
  assert.deepEqual(parseDeployOptions(['--assume-vpn', '--preflight-only']), { help: false, assumeVpn: true, preflightOnly: true });
  assert.equal(parseDeployOptions(['-h']).help, true);
  assert.throws(() => parseDeployOptions(['--skip-build']));
  assert.throws(() => parseDeployOptions(['--host=other-server']));
  assert.throws(() => parseDeployOptions(['/other/path']));
});

test('real CLI help succeeds without networking, SSH authentication or a build', async () => {
  const { stdout } = await execute(process.execPath, [cli, '--help'], { cwd: '/tmp', timeout: 5000 });
  assert.match(stdout, /사용법: pnpm deploy/);
  assert.match(stdout, /current를 원자적으로 전환/);
  assert.match(stdout, /실패하면 이전 current로 자동 복구/);
  assert.doesNotMatch(stdout, /pnpm build 실행 중/);
});

test('real CLI refuses noninteractive execution without VPN approval', async () => {
  await assert.rejects(execute(process.execPath, [cli], { timeout: 5000 }), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /비대화형 실행에는 명시적인 VPN 확인이 필요합니다/);
    assert.doesNotMatch(error.stdout, /SSH 포트 접근: OK|pnpm build 실행 중/);
    return true;
  });
});

test('command runner reports failure and a missing executable', async () => {
  await assert.rejects(runCommand(process.execPath, ['-e', 'process.exit(7)']), /실행에 실패했습니다 \(7\)/);
  await assert.rejects(runCommand('/nonexistent/owp-deploy-command', []), /실행을 시작하지 못했습니다/);
});

test('refuses to package a build if its inputs change during the build', async () => {
  const { calls, dependencies } = scenario();
  let reads = 0;
  dependencies.context = async () => ({ ...context, fingerprint: reads++ === 0 ? 'before' : 'after' });
  await assert.rejects(runDeployment({}, dependencies), /빌드·artifact 생성 중/);
  assert.ok(!calls.some((call) => ['package', 'upload'].includes(call.name)));
});

test('cleans the local artifact and refuses upload if inputs change during packaging', async () => {
  const { calls, dependencies } = scenario();
  let reads = 0;
  dependencies.context = async () => ({ ...context, fingerprint: reads++ < 2 ? 'before' : 'after' });
  await assert.rejects(runDeployment({}, dependencies), /빌드·artifact 생성 중/);
  assert.ok(!calls.some((call) => call.name === 'upload'));
  assert.equal(calls.at(-1).name, 'cleanup');
});

test('command runner captures stdout while leaving native SSH input available', async () => {
  assert.equal(await runCommand(process.execPath, ['-e', 'console.log("ready")'], { capture: true }), 'ready\n');
});
