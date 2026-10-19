import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, chmod, copyFile, lstat, mkdir, mkdtemp, readFile, readdir, readlink, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { activateRelease } from '../deploy-activation.mjs';
import { createArtifact, fileSha256 } from '../deploy-artifact.mjs';
import { stageRelease } from '../deploy-staging.mjs';
import { transferArtifact } from '../deploy-transfer.mjs';

const execute = promisify(execFile);
const quote = (value) => `'${String(value).replaceAll("'", `'"'"'`)}'`;

async function fixture(t) {
  const workspace = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-activation-test-')));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const directory = path.join(workspace, 'dist');
  await mkdir(path.join(directory, 'assets'), { recursive: true });
  await writeFile(path.join(directory, 'index.html'), '<script src="/assets/app.js"></script><link href="/assets/app.css" rel="stylesheet">');
  await writeFile(path.join(directory, 'robots.txt'), 'User-agent: *');
  await writeFile(path.join(directory, 'packages.json'), '{"packages":[{"name":"@owp/core"}]}');
  await writeFile(path.join(directory, 'assets/app.js'), 'console.log("new release")');
  await writeFile(path.join(directory, 'assets/app.css'), 'body{margin:0}');
  const artifact = await createArtifact({
    directory, context: { commit: 'a1b2c3d4e5f6', packages: { '@owp/core': '6.1.0' }, dirty: true },
    builtAt: new Date('2026-10-19T17:30:00.000Z'),
  });
  t.after(artifact.cleanup);
  const base = path.join(workspace, 'server');
  await mkdir(path.join(base, 'releases/initial'), { recursive: true });
  await writeFile(path.join(base, 'releases/initial/index.html'), 'existing service');
  await symlink('releases/initial', path.join(base, 'current'));
  const config = { host: '192.168.100.20', sshPort: 22, user: 'root', timeoutMs: 5000, remoteRoot: base };
  const calls = [];
  const controls = { environment: process.env, output: (stdout) => stdout };
  const run = async (command, args, settings) => {
    calls.push({ command, args, settings });
    if (command === 'scp') {
      await copyFile(args.at(-2), args.at(-1).slice(args.at(-1).indexOf(':') + 1));
      return;
    }
    assert.equal(command, 'ssh');
    try {
      const { stdout } = await execute('bash', ['-c', args.at(-1)], { env: controls.environment, timeout: 10_000 });
      return controls.output(stdout);
    } catch (error) {
      throw new Error(`${error.stderr}\n${error.stdout}`.trim());
    }
  };
  const uploaded = await transferArtifact(config, artifact, { interactive: true, run, log() {} });
  const staged = await stageRelease(config, artifact, uploaded, { interactive: true, run });
  const incoming = path.dirname(uploaded.archive);
  const destination = path.join(base, 'releases', artifact.release);
  const temporary = path.join(base, `.current-${artifact.release}-${uploaded.owner}`);
  const activate = () => activateRelease(config, artifact, uploaded, staged, { interactive: true, run });
  const assertCurrent = async () => {
    assert.equal(await readlink(path.join(base, 'current')), 'releases/initial');
    assert.equal(await readFile(path.join(base, 'current/index.html'), 'utf8'), 'existing service');
  };
  const assertCleaned = async () => {
    await assert.rejects(lstat(temporary), { code: 'ENOENT' });
    await assert.rejects(access(path.join(base, '.deploy-lock')), { code: 'ENOENT' });
  };
  const commandShim = async (name, body) => {
    const bin = path.join(workspace, 'bin');
    await mkdir(bin, { recursive: true });
    const file = path.join(bin, name);
    await writeFile(file, `#!/bin/bash\nset -eu\n${body}\n`);
    await chmod(file, 0o755);
    controls.environment = { ...process.env, PATH: `${bin}:${process.env.PATH}` };
  };
  return { workspace, base, artifact, config, uploaded, staged, incoming, destination, temporary, calls, controls, run, activate, assertCurrent, assertCleaned, commandShim };
}

test('atomically switches a real staged release and records the previous target privately', async (t) => {
  const state = await fixture(t);
  const contentInode = (await lstat(state.staged.directory)).ino;
  const oldInode = (await lstat(path.join(state.base, 'releases/initial'))).ino;
  const oldIndex = await fileSha256(path.join(state.base, 'current/index.html'));
  const result = await state.activate();
  assert.equal(result.previous, 'initial');
  assert.equal(result.previousTarget, 'releases/initial');
  assert.equal(result.directory, state.destination);
  assert.equal((await lstat(state.destination)).ino, contentInode);
  assert.equal((await lstat(path.join(state.base, 'releases/initial'))).ino, oldInode);
  assert.equal(await fileSha256(path.join(state.base, 'releases/initial/index.html')), oldIndex);
  assert.equal(await readlink(path.join(state.base, 'current')), `releases/${state.artifact.release}`);
  assert.equal(JSON.parse(await readFile(path.join(state.base, 'current/release.json'), 'utf8')).release, state.artifact.release);
  assert.deepEqual(JSON.parse(await readFile(result.record, 'utf8')), {
    release: state.artifact.release, artifactSha256: state.artifact.sha256,
    previous: 'initial', previousTarget: 'releases/initial',
  });
  assert.equal((await lstat(result.record)).mode & 0o777, 0o600);
  assert.ok(!(await readdir(state.destination)).includes('.activation.json'));
  await assert.rejects(access(state.staged.directory), { code: 'ENOENT' });
  await access(state.uploaded.archive);
  await state.assertCleaned();
  assert.ok(state.calls.at(-1).args.includes('StrictHostKeyChecking=yes'));
  assert.ok(state.calls.at(-1).args.includes('BatchMode=no'));
  assert.deepEqual(state.calls.at(-1).settings, { capture: true });
});

test('current remains readable throughout the real local switch', async (t) => {
  const state = await fixture(t);
  const oldIndex = 'existing service';
  const newIndex = await readFile(path.join(state.staged.directory, 'index.html'), 'utf8');
  const inodeFile = path.join(state.workspace, 'temporary-inode');
  const statArgs = process.platform === 'darwin' ? ['-f', '%i'] : ['-c', '%i'];
  await state.commandShim('mv', `
if test "$4" = ${quote(path.join(state.base, 'current'))}; then
  stat ${statArgs.map(quote).join(' ')} ${quote(state.temporary)} > ${quote(inodeFile)}
fi
exec /bin/mv "$@"`);
  let running = true;
  let samples = 0;
  const reader = (async () => {
    while (running) {
      const value = await readFile(path.join(state.base, 'current/index.html'), 'utf8');
      assert.ok(value === oldIndex || value === newIndex);
      samples++;
    }
  })();
  try { await state.activate(); }
  finally { running = false; await reader; }
  assert.ok(samples > 2);
  const temporaryInode = Number((await readFile(inodeFile, 'utf8')).trim());
  assert.equal((await lstat(path.join(state.base, 'current'))).ino, temporaryInode);
  await state.assertCleaned();
});

test('preserves an absolute previous target for recovery', async (t) => {
  const state = await fixture(t);
  const previous = '20261019-023000-0123456789ab';
  const previousDirectory = path.join(state.base, 'releases', previous);
  await mkdir(previousDirectory);
  await writeFile(path.join(previousDirectory, 'index.html'), 'previous release');
  await rm(path.join(state.base, 'current'));
  await symlink(previousDirectory, path.join(state.base, 'current'));
  const result = await state.activate();
  assert.equal(result.previous, previous);
  assert.equal(result.previousTarget, previousDirectory);
  assert.equal(JSON.parse(await readFile(result.record, 'utf8')).previousTarget, previousDirectory);
  assert.equal(await readFile(path.join(previousDirectory, 'index.html'), 'utf8'), 'previous release');
});

for (const [name, mutate, message] of [
  ['changed index', (s) => writeFile(path.join(s.staged.directory, 'index.html'), 'changed'), /checksum|match|FAILED/i],
  ['changed metadata', (s) => writeFile(path.join(s.staged.directory, 'release.json'), '{}'), /checksum|match|FAILED/i],
  ['changed checksum list', (s) => writeFile(path.join(s.staged.directory, 'deploy-files.sha256'), 'changed'), /checksum|match|FAILED/i],
  ['missing asset', (s) => rm(path.join(s.staged.directory, 'assets/app.js')), /파일 수가 일치하지/],
  ['extra file', (s) => writeFile(path.join(s.staged.directory, 'extra'), 'extra'), /파일 수가 일치하지/],
  ['missing staging receipt', (s) => rm(path.join(s.incoming, '.stage-verified')), /staging 검증 기록이 없습니다/],
  ['changed staging receipt', (s) => writeFile(path.join(s.incoming, '.stage-verified'), '{}'), /staging 검증 기록이 일치하지/],
  ['previous activation record', (s) => writeFile(path.join(s.incoming, '.activation.json'), 'keep'), /전환 기록이 이미/],
  ['existing final release', (s) => mkdir(s.destination), /같은 릴리스가 이미/],
  ['existing final symlink', (s) => symlink('/missing', s.destination), /같은 릴리스가 이미/],
  ['foreign owner', (s) => writeFile(path.join(s.incoming, '.upload-owner'), 'other'), /다른 업로드가 소유한/],
]) {
  test(`preserves current and staging when activation finds ${name}`, async (t) => {
    const state = await fixture(t);
    await mutate(state);
    await assert.rejects(state.activate(), message);
    await state.assertCurrent();
    await state.assertCleaned();
    await access(state.staged.directory);
    await access(state.uploaded.archive);
  });
}

test('rejects a symlink introduced after staging before checking file hashes', async (t) => {
  const state = await fixture(t);
  await rm(path.join(state.staged.directory, 'assets/app.js'));
  await symlink(path.join(state.base, 'releases/initial/index.html'), path.join(state.staged.directory, 'assets/app.js'));
  await assert.rejects(state.activate(), /링크 또는 특수 파일/);
  await state.assertCurrent();
  await state.assertCleaned();
});

test('does not follow a replaced content directory symlink', async (t) => {
  const state = await fixture(t);
  await rm(state.staged.directory, { recursive: true });
  await symlink(path.join(state.base, 'releases/initial'), state.staged.directory);
  await assert.rejects(state.activate(), /content 디렉터리가 올바르지/);
  await state.assertCurrent();
  assert.ok((await lstat(state.staged.directory)).isSymbolicLink());
});

test('a foreign deployment lock and temporary symlink are never removed', async (t) => {
  const state = await fixture(t);
  const lock = path.join(state.base, '.deploy-lock');
  await mkdir(lock);
  await writeFile(path.join(lock, 'owner'), 'other deployment');
  await symlink('releases/initial', state.temporary);
  await assert.rejects(state.activate(), /다른 배포가 진행 중/);
  assert.equal(await readFile(path.join(lock, 'owner'), 'utf8'), 'other deployment');
  assert.equal(await readlink(state.temporary), 'releases/initial');
  await rm(lock, { recursive: true });
  await assert.rejects(state.activate(), /임시 symlink 경로가 이미/);
  assert.equal(await readlink(state.temporary), 'releases/initial');
  await state.assertCurrent();
});

test('rejects different filesystem devices before promoting any files', async (t) => {
  const state = await fixture(t);
  await state.commandShim('stat', `
for target; do :; done
if test "$target" = ${quote(state.staged.directory)}; then
  printf '999999\n'
else
  exec /usr/bin/stat "$@"
fi`);
  await assert.rejects(state.activate(), /같은 파일시스템에 있지/);
  await state.assertCurrent();
  await access(state.staged.directory);
  await assert.rejects(access(state.destination), { code: 'ENOENT' });
  await state.assertCleaned();
});

for (const point of ['promotion', 'switch']) {
  test(`a filesystem error during ${point} keeps the old current and recovery files`, async (t) => {
    const state = await fixture(t);
    const target = point === 'promotion' ? state.destination : path.join(state.base, 'current');
    await state.commandShim('mv', `
if test "$4" = ${quote(target)}; then printf 'simulated mv error\n' >&2; exit 72; fi
exec /bin/mv "$@"`);
    await assert.rejects(state.activate(), /simulated mv error/);
    await state.assertCurrent();
    await state.assertCleaned();
    await access(path.join(state.incoming, '.activation.json'));
    await access(state.uploaded.archive);
    await access(point === 'promotion' ? state.staged.directory : state.destination);
    await assert.rejects(state.activate(), /content 디렉터리가 올바르지|같은 릴리스가 이미|전환 기록이 이미/);
    await state.assertCurrent();
  });
}

test('a missing SSH completion receipt preserves the switched release and recovery record', async (t) => {
  const state = await fixture(t);
  state.controls.output = () => '';
  await assert.rejects(state.activate(), /current 전환 완료 응답을 확인할 수 없습니다/);
  assert.equal(await readlink(path.join(state.base, 'current')), `releases/${state.artifact.release}`);
  await access(state.destination);
  await access(path.join(state.incoming, '.activation.json'));
  await access(path.join(state.base, 'releases/initial/index.html'));
  await state.assertCleaned();
});

test('an error reported after the rename never deletes the now active release', async (t) => {
  const state = await fixture(t);
  await state.commandShim('mv', `
/bin/mv "$@"
if test "$4" = ${quote(path.join(state.base, 'current'))}; then
  printf 'connection lost after rename\n' >&2
  exit 72
fi`);
  await assert.rejects(state.activate(), /connection lost after rename/);
  assert.equal(await readlink(path.join(state.base, 'current')), `releases/${state.artifact.release}`);
  await access(path.join(state.destination, 'index.html'));
  await access(path.join(state.incoming, '.activation.json'));
  await access(path.join(state.base, 'releases/initial/index.html'));
  await state.assertCleaned();
});

test('a current change immediately before replacement is preserved instead of overwritten', async (t) => {
  const state = await fixture(t);
  const other = '20261019-030000-0123456789ab';
  await mkdir(path.join(state.base, 'releases', other));
  await writeFile(path.join(state.base, 'releases', other, 'index.html'), 'another release');
  await state.commandShim('mv', `
/bin/mv "$@"
if test "$4" = ${quote(state.destination)}; then
  /bin/rm ${quote(path.join(state.base, 'current'))}
  /bin/ln -s ${quote(`releases/${other}`)} ${quote(path.join(state.base, 'current'))}
fi`);
  await assert.rejects(state.activate(), /전환 직전에 current가 변경/);
  assert.equal(await readlink(path.join(state.base, 'current')), `releases/${other}`);
  assert.equal(await readFile(path.join(state.base, 'current/index.html'), 'utf8'), 'another release');
  await access(path.join(state.destination, 'index.html'));
  await access(path.join(state.base, 'releases/initial/index.html'));
  await state.assertCleaned();
});

test('inconsistent local staging identity stops before any activation SSH command', async (t) => {
  const state = await fixture(t);
  const count = state.calls.length;
  for (const changed of [
    { ...state.staged, release: 'other' }, { ...state.staged, sha256: '0'.repeat(64) },
    { ...state.staged, files: 999 }, { ...state.staged, directory: '/outside' },
  ]) {
    await assert.rejects(activateRelease(state.config, state.artifact, state.uploaded, changed, { interactive: true, run: state.run }), /staging 릴리스 정보가 일치하지/);
  }
  assert.equal(state.calls.length, count);
  await state.assertCurrent();
});
