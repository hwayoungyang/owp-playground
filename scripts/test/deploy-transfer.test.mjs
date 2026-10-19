import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, copyFile, mkdir, mkdtemp, readFile, readlink, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileSha256 } from '../deploy-artifact.mjs';
import { remoteUploadCommand, transferArtifact } from '../deploy-transfer.mjs';

const execute = promisify(execFile);
const release = '20261020-023000-a1b2c3d4e5f6';

async function fixture(t, options = {}) {
  const workspace = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-transfer-test-')));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const base = path.join(workspace, 'server');
  await mkdir(path.join(base, 'releases/initial'), { recursive: true });
  await writeFile(path.join(base, 'releases/initial/index.html'), 'existing live content');
  await symlink('releases/initial', path.join(base, 'current'));
  const archive = path.join(workspace, 'artifact.tar.gz');
  await writeFile(archive, 'valid artifact bytes');
  const artifact = { release, archive, bytes: 20, sha256: await fileSha256(archive) };
  const config = { host: '192.168.100.20', sshPort: 22, user: 'root', timeoutMs: 5000, remoteRoot: base };
  const incoming = path.join(base, 'releases', `.incoming-${release}`);
  const calls = [];
  const logs = [];
  const run = async (command, args, settings) => {
    calls.push({ command, args, settings });
    if (command === 'scp') {
      const target = args.at(-1).slice(args.at(-1).indexOf(':') + 1);
      if (options.copyFailure) {
        await writeFile(target, 'partial');
        throw new Error('SCP transfer failed');
      }
      await copyFile(args.at(-2), target);
      if (options.corrupt) await writeFile(target, 'wrong artifact bytes');
      return;
    }
    assert.equal(command, 'ssh');
    const script = args.at(-1);
    if (options.cleanupFailure && script.includes("'cleanup'")) throw new Error('SSH cleanup failed');
    try {
      const { stdout } = await execute('bash', ['-c', script]);
      return options.missingReceipt && script.includes("'verify'") ? '' : stdout;
    } catch (error) {
      throw new Error(`${error.stderr}\n${error.stdout}`.trim());
    }
  };
  const transfer = () => transferArtifact(config, artifact, { interactive: true, run, log: (line) => logs.push(line) });
  const assertCurrent = async () => {
    assert.equal(await readlink(path.join(base, 'current')), 'releases/initial');
    assert.equal(await readFile(path.join(base, 'current/index.html'), 'utf8'), 'existing live content');
  };
  return { base, artifact, config, incoming, calls, logs, transfer, assertCurrent };
}

test('SCP upload is verified by the real remote shell without changing current', async (t) => {
  const state = await fixture(t);
  const result = await state.transfer();
  assert.equal(result.sha256, state.artifact.sha256);
  assert.equal(result.archive, path.join(state.incoming, 'artifact.tar.gz'));
  assert.equal(await readFile(result.archive, 'utf8'), 'valid artifact bytes');
  assert.equal(await readFile(path.join(state.incoming, 'artifact.sha256'), 'utf8'), `${state.artifact.sha256}  artifact.tar.gz\n`);
  assert.deepEqual(state.calls.map((call) => call.command), ['ssh', 'scp', 'ssh']);
  const scp = state.calls[1];
  assert.deepEqual(scp.args.slice(0, 2), ['-P', '22']);
  assert.ok(scp.args.includes('StrictHostKeyChecking=yes'));
  assert.ok(scp.args.includes('BatchMode=no'));
  assert.ok(!scp.args.includes('sshpass'));
  await state.assertCurrent();
});

test('checksum mismatch removes the failed upload and preserves current', async (t) => {
  const state = await fixture(t, { corrupt: true });
  await assert.rejects(state.transfer(), /checksum|match|SHA-256/i);
  assert.deepEqual(state.calls.slice(0, 3).map((call) => call.command), ['ssh', 'scp', 'ssh']);
  await assert.rejects(access(state.incoming), { code: 'ENOENT' });
  await state.assertCurrent();
});

test('partial SCP failure cleans only its owned temporary upload', async (t) => {
  const state = await fixture(t, { copyFailure: true });
  await assert.rejects(state.transfer(), /SCP transfer failed/);
  await assert.rejects(access(state.incoming), { code: 'ENOENT' });
  await state.assertCurrent();
});

test('an SSH success without the verification receipt is treated as failure', async (t) => {
  const state = await fixture(t, { missingReceipt: true });
  await assert.rejects(state.transfer(), /SHA-256 검증 응답/);
  await assert.rejects(access(state.incoming), { code: 'ENOENT' });
  await state.assertCurrent();
});

test('a failed cleanup reports the remaining path and retains the original error', async (t) => {
  const state = await fixture(t, { copyFailure: true, cleanupFailure: true });
  await assert.rejects(state.transfer(), /SCP transfer failed/);
  assert.ok(state.logs.some((line) => line.includes(state.incoming)));
  await access(state.incoming);
  await state.assertCurrent();
});

test('a duplicate release cannot overwrite a completed upload', async (t) => {
  const state = await fixture(t);
  await state.transfer();
  const originalOwner = await readFile(path.join(state.incoming, '.upload-owner'), 'utf8');
  await assert.rejects(state.transfer(), /같은 릴리스의 업로드가 이미/);
  assert.equal(await readFile(path.join(state.incoming, '.upload-owner'), 'utf8'), originalOwner);
  assert.equal(await readFile(path.join(state.incoming, 'artifact.tar.gz'), 'utf8'), 'valid artifact bytes');
  await state.assertCurrent();
});

test('an existing final release is protected from a new upload with the same ID', async (t) => {
  const state = await fixture(t);
  await mkdir(path.join(state.base, 'releases', release));
  await assert.rejects(state.transfer(), /같은 릴리스가 이미/);
  assert.equal(state.calls.length, 1);
  await assert.rejects(access(state.incoming), { code: 'ENOENT' });
  await state.assertCurrent();
});

test('a modified local artifact is rejected before any SSH or SCP command', async (t) => {
  const state = await fixture(t);
  await writeFile(state.artifact.archive, 'wrong artifact bytes');
  await assert.rejects(state.transfer(), /생성 후 내용이 변경/);
  assert.equal(state.calls.length, 0);
});

test('a missing local artifact is rejected before any SSH or SCP command', async (t) => {
  const state = await fixture(t);
  await rm(state.artifact.archive);
  await assert.rejects(state.transfer(), { code: 'ENOENT' });
  assert.equal(state.calls.length, 0);
});

test('symlinks cannot redirect an incoming upload outside releases', async (t) => {
  const state = await fixture(t);
  const outside = path.join(state.base, 'outside');
  await mkdir(outside);
  await writeFile(path.join(outside, 'protected'), 'keep');
  await symlink(outside, state.incoming);
  await assert.rejects(state.transfer(), /같은 릴리스의 업로드가 이미/);
  assert.equal(await readFile(path.join(outside, 'protected'), 'utf8'), 'keep');
  await state.assertCurrent();
});

test('cleanup refuses a directory owned by another upload', async (t) => {
  const state = await fixture(t);
  await state.transfer();
  await assert.rejects(execute('bash', ['-c', remoteUploadCommand('cleanup', state.config, state.artifact, '0'.repeat(32))]), (error) => {
    assert.match(error.stderr, /다른 업로드가 소유한/);
    return true;
  });
  assert.equal(await readFile(path.join(state.incoming, 'artifact.tar.gz'), 'utf8'), 'valid artifact bytes');
});

test('unsafe release IDs and remote roots are rejected before shell execution', async (t) => {
  const state = await fixture(t);
  assert.throws(() => remoteUploadCommand('prepare', state.config, { ...state.artifact, release: '../current' }, '0'.repeat(32)), /artifact 업로드 정보/);
  for (const remoteRoot of ['/', '/home/../verdaccio', '/home/owp;touch bad', '-option']) {
    assert.throws(() => remoteUploadCommand('prepare', { ...state.config, remoteRoot }, state.artifact, '0'.repeat(32)), /배포 기준 경로/);
  }
});
