import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, copyFile, link, lstat, mkdir, mkdtemp, readFile, readlink, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createArtifact, fileSha256 } from '../deploy-artifact.mjs';
import { stageRelease } from '../deploy-staging.mjs';
import { transferArtifact } from '../deploy-transfer.mjs';

const execute = promisify(execFile);

function mutateHeader(compressed, edit) {
  const tar = gunzipSync(compressed);
  let offset = 0;
  while (offset + 512 <= tar.length && tar[offset] !== 0) {
    const header = tar.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString().replace(/\0.*$/s, '');
    const size = parseInt(header.subarray(124, 136).toString().replace(/\0.*$/s, '').trim(), 8) || 0;
    const length = 512 + Math.ceil(size / 512) * 512;
    if (name === './assets/app.js') {
      if (edit === 'duplicate') return gzipSync(Buffer.concat([tar.subarray(0, offset), tar.subarray(offset, offset + length), tar.subarray(offset)]));
      header.fill(0, 0, 100);
      header.write(edit, 0, 'ascii');
      header.fill(32, 148, 156);
      const checksum = header.reduce((sum, value) => sum + value, 0);
      header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148, 'ascii');
      return gzipSync(tar);
    }
    offset += length;
  }
  throw new Error('Fixture tar entry not found');
}

async function fixture(t, options = {}) {
  const workspace = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-staging-test-')));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const directory = path.join(workspace, 'dist');
  await mkdir(path.join(directory, 'assets'), { recursive: true });
  await writeFile(path.join(directory, 'index.html'), '<script src="/assets/app.js"></script><link href="/assets/app.css" rel="stylesheet">');
  await writeFile(path.join(directory, 'robots.txt'), 'User-agent: *');
  await writeFile(path.join(directory, 'packages.json'), '{"packages":[{"name":"@owp/core"}]}');
  await writeFile(path.join(directory, 'assets/app.js'), 'console.log("staging")');
  await writeFile(path.join(directory, 'assets/app.css'), 'body{margin:0}');
  const context = { commit: 'a1b2c3d4e5f6', packages: { '@owp/core': '6.1.0' }, dirty: true };
  const artifact = await createArtifact({ directory, context, builtAt: new Date('2026-10-19T17:30:00.000Z') });
  t.after(artifact.cleanup);
  if (options.mutateContent) {
    const unpacked = path.join(workspace, 'unpacked');
    await mkdir(unpacked);
    await execute('tar', ['-xzf', artifact.archive, '-C', unpacked]);
    await options.mutateContent(unpacked, artifact);
    await execute('tar', ['--format=ustar', '-czf', artifact.archive, '-C', unpacked, '.']);
  }
  if (options.header) await writeFile(artifact.archive, mutateHeader(await readFile(artifact.archive), options.header));
  artifact.sha256 = await fileSha256(artifact.archive);
  artifact.bytes = (await lstat(artifact.archive)).size;
  const base = path.join(workspace, 'server');
  await mkdir(path.join(base, 'releases/initial'), { recursive: true });
  await writeFile(path.join(base, 'releases/initial/index.html'), 'existing service');
  await symlink('releases/initial', path.join(base, 'current'));
  const config = { host: '192.168.100.20', sshPort: 22, user: 'root', timeoutMs: 5000, remoteRoot: base };
  const calls = [];
  const run = async (command, args) => {
    calls.push({ command, args });
    if (command === 'scp') {
      await copyFile(args.at(-2), args.at(-1).slice(args.at(-1).indexOf(':') + 1));
      return;
    }
    assert.equal(command, 'ssh');
    try {
      const { stdout } = await execute('bash', ['-c', args.at(-1)]);
      return options.missingReceipt && args.at(-1).includes("'stage'") ? '' : stdout;
    } catch (error) {
      throw new Error(`${error.stderr}\n${error.stdout}`.trim());
    }
  };
  const uploaded = await transferArtifact(config, artifact, { interactive: true, run, log() {} });
  const incoming = path.dirname(uploaded.archive);
  const stage = () => stageRelease(config, artifact, uploaded, { interactive: true, run });
  const assertCurrent = async () => {
    assert.equal(await readlink(path.join(base, 'current')), 'releases/initial');
    assert.equal(await readFile(path.join(base, 'current/index.html'), 'utf8'), 'existing service');
  };
  const assertFailureCleaned = async () => {
    for (const item of [path.join(base, '.deploy-lock'), path.join(incoming, '.extract'), path.join(incoming, 'content'), path.join(incoming, '.stage-verified')]) {
      await assert.rejects(access(item), { code: 'ENOENT' });
    }
    await access(uploaded.archive);
    await assertCurrent();
  };
  return { workspace, base, incoming, config, artifact, uploaded, calls, run, stage, assertCurrent, assertFailureCleaned };
}

test('stages a real artifact, verifies every file and preserves current', async (t) => {
  const state = await fixture(t);
  const staged = await state.stage();
  assert.equal(staged.directory, path.join(state.incoming, 'content'));
  assert.equal(staged.files, 8);
  const metadata = JSON.parse(await readFile(path.join(staged.directory, 'release.json'), 'utf8'));
  assert.equal(metadata.release, state.artifact.release);
  assert.equal(metadata.packages['@owp/core'], '6.1.0');
  assert.equal((await lstat(staged.directory)).mode & 0o777, 0o755);
  assert.equal((await lstat(path.join(staged.directory, 'assets/app.js'))).mode & 0o777, 0o644);
  const receipt = JSON.parse(await readFile(path.join(state.incoming, '.stage-verified'), 'utf8'));
  assert.equal(receipt.artifactSha256, state.artifact.sha256);
  await assert.rejects(access(path.join(state.base, '.deploy-lock')), { code: 'ENOENT' });
  await assert.rejects(access(path.join(state.incoming, '.extract')), { code: 'ENOENT' });
  assert.ok(state.calls.at(-1).args.includes('StrictHostKeyChecking=yes'));
  assert.ok(state.calls.at(-1).args.includes('BatchMode=no'));
  await state.assertCurrent();
});

for (const [name, mutateContent, message] of [
  ['changed index', async (dir) => writeFile(path.join(dir, 'index.html'), 'tampered index'), /checksum|match|FAILED/i],
  ['changed release metadata', async (dir) => writeFile(path.join(dir, 'release.json'), '{"release":"other"}'), /checksum|match|FAILED/i],
  ['missing asset', async (dir) => rm(path.join(dir, 'assets/app.js')), /파일 수가 일치하지/],
  ['extra file', async (dir) => writeFile(path.join(dir, 'extra.txt'), 'extra'), /파일 수가 일치하지/],
  ['changed checksum list', async (dir) => writeFile(path.join(dir, 'deploy-files.sha256'), 'invalid'), /checksum|match|FAILED/i],
  ['symbolic link', async (dir) => { await rm(path.join(dir, 'assets/app.js')); await symlink('/etc/hosts', path.join(dir, 'assets/app.js')); }, /링크 또는 특수 파일/],
  ['hard link', async (dir) => { await rm(path.join(dir, 'assets/app.js')); await link(path.join(dir, 'index.html'), path.join(dir, 'assets/app.js')); }, /링크 또는 특수 파일/],
  ['FIFO', async (dir) => { await rm(path.join(dir, 'assets/app.js')); await execute('mkfifo', [path.join(dir, 'assets/app.js')]); }, /링크 또는 특수 파일/],
]) {
  test(`rejects ${name} even when the outer archive checksum matches`, async (t) => {
    const state = await fixture(t, { mutateContent });
    await assert.rejects(state.stage(), message);
    await state.assertFailureCleaned();
  });
}

for (const header of ['../outside.txt', '/absolute.txt', '/', './assets/../outside.txt', './assets/name with spaces.js', './assets/line\nbreak.js', 'duplicate']) {
  test(`rejects unsafe or duplicate archive paths: ${JSON.stringify(header)}`, async (t) => {
    const state = await fixture(t, { header });
    await assert.rejects(state.stage(), /경로 이탈·중복·지원하지 않는 경로/);
    await assert.rejects(access(path.join(state.base, 'releases/outside.txt')), { code: 'ENOENT' });
    await state.assertFailureCleaned();
  });
}

test('rechecks the uploaded archive before extraction', async (t) => {
  const state = await fixture(t);
  await writeFile(state.uploaded.archive, 'corrupt after upload');
  await assert.rejects(state.stage(), /artifact 크기가 일치하지|checksum|match/i);
  await state.assertFailureCleaned();
});

test('an existing deployment lock is never removed by another attempt', async (t) => {
  const state = await fixture(t);
  const lock = path.join(state.base, '.deploy-lock');
  await mkdir(lock);
  await writeFile(path.join(lock, 'owner'), 'other deployment');
  await assert.rejects(state.stage(), /다른 배포가 진행 중/);
  assert.equal(await readFile(path.join(lock, 'owner'), 'utf8'), 'other deployment');
  await state.assertCurrent();
});

test('an already staged release is preserved on a duplicate staging request', async (t) => {
  const state = await fixture(t);
  const first = await state.stage();
  const before = await fileSha256(path.join(first.directory, 'index.html'));
  await assert.rejects(state.stage(), /이미 staging된 릴리스/);
  assert.equal(await fileSha256(path.join(first.directory, 'index.html')), before);
  await state.assertCurrent();
});

test('a missing completion response preserves a completed stage for inspection', async (t) => {
  const state = await fixture(t, { missingReceipt: true });
  await assert.rejects(state.stage(), /staging 완료 응답/);
  await access(path.join(state.incoming, 'content/index.html'));
  await access(path.join(state.incoming, '.stage-verified'));
  await assert.rejects(access(path.join(state.base, '.deploy-lock')), { code: 'ENOENT' });
  await state.assertCurrent();
});

test('upload identity mismatches stop before the staging SSH command', async (t) => {
  const state = await fixture(t);
  const before = state.calls.length;
  await assert.rejects(stageRelease(state.config, state.artifact, { ...state.uploaded, release: 'different' }, { interactive: true, run: state.run }), /메타데이터가 일치하지/);
  assert.equal(state.calls.length, before);
});

test('staging cannot use another upload owner', async (t) => {
  const state = await fixture(t);
  await assert.rejects(stageRelease(state.config, state.artifact, { ...state.uploaded, owner: '0'.repeat(32) }, { interactive: true, run: state.run }), /다른 업로드가 소유한/);
  await access(state.uploaded.archive);
  await state.assertCurrent();
});

test('a symlink in the extraction slot cannot redirect extraction or cleanup', async (t) => {
  const state = await fixture(t);
  const outside = path.join(state.workspace, 'outside');
  await mkdir(outside);
  await writeFile(path.join(outside, 'protected'), 'keep');
  await symlink(outside, path.join(state.incoming, '.extract'));
  await assert.rejects(state.stage(), /staging 임시 경로가 이미/);
  assert.equal(await readFile(path.join(outside, 'protected'), 'utf8'), 'keep');
  await state.assertCurrent();
});

test('rejects a dangerous checksum path before it can read outside content', async (t) => {
  const state = await fixture(t, { mutateContent: async (directory, artifact) => {
    const file = path.join(directory, 'deploy-files.sha256');
    const text = (await readFile(file, 'utf8')).replace('  assets/app.js\n', '  ../outside.txt\n');
    await writeFile(file, text);
    artifact.integrity.checklistSha256 = createHash('sha256').update(text).digest('hex');
  } });
  await assert.rejects(state.stage(), /SHA-256 목록의 경로·형식·파일 수/);
  await state.assertFailureCleaned();
});
