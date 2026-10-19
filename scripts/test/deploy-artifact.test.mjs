import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createArtifact, createReleaseId, fileSha256, readBuildContext } from '../deploy-artifact.mjs';

const execute = promisify(execFile);
const context = { commit: 'a1b2c3d4e5f6', packages: { '@owp/core': '6.1.0' }, dirty: true };
const builtAt = new Date('2026-10-19T17:30:00.000Z');

async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'owp-artifact-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'assets'));
  await writeFile(path.join(directory, 'index.html'), '<script src="/assets/app.js"></script><link href="/assets/app.css" rel="stylesheet">');
  await writeFile(path.join(directory, 'robots.txt'), 'User-agent: *');
  await writeFile(path.join(directory, 'packages.json'), '{"packages":[{"name":"@owp/core"}]}');
  await writeFile(path.join(directory, 'assets/app.js'), 'console.log("local changes")');
  await writeFile(path.join(directory, 'assets/app.css'), 'body{margin:0}');
  return directory;
}

test('release IDs use the Korean date and preserve the requested SHA', () => {
  assert.equal(createReleaseId(context.commit, builtAt), '20261020-023000-a1b2c3d4e5f6');
  assert.throws(() => createReleaseId('../outside', builtAt), /Git SHA/);
});

test('packs static files, actual version metadata and verifiable per-file hashes', async (t) => {
  const directory = await fixture(t);
  const artifact = await createArtifact({ directory, context, builtAt });
  t.after(artifact.cleanup);
  const { stdout: listing } = await execute('tar', ['-tzf', artifact.archive]);
  assert.match(listing, /\.\/release.json/);
  assert.match(listing, /\.\/deploy-manifest.json/);
  assert.match(listing, /\.\/deploy-files.sha256/);
  assert.doesNotMatch(listing, /node_modules|\.git\/|\.ssh\//);
  const { stdout: metadataText } = await execute('tar', ['-xzOf', artifact.archive, './release.json']);
  const metadata = JSON.parse(metadataText);
  assert.equal(metadata.release, '20261020-023000-a1b2c3d4e5f6');
  assert.equal(metadata.builtAt, builtAt.toISOString());
  assert.equal(metadata.dirty, true);
  assert.deepEqual(metadata.packages, context.packages);
  assert.deepEqual(Object.keys(metadata).sort(), ['builtAt', 'commit', 'contentSha256', 'dirty', 'packages', 'release']);
  const { stdout: manifestText } = await execute('tar', ['-xzOf', artifact.archive, './deploy-manifest.json']);
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.version, 1);
  for (const [file, entry] of Object.entries(manifest.files)) {
    const { stdout } = await execute('tar', ['-xzOf', artifact.archive, `./${file}`], { encoding: 'buffer' });
    assert.equal(entry.bytes, stdout.length);
    assert.equal(entry.sha256, createHash('sha256').update(stdout).digest('hex'));
  }
  assert.equal(artifact.sha256, await fileSha256(artifact.archive));
  assert.equal(artifact.bytes, (await readFile(artifact.archive)).length);
  const { stdout: checklist } = await execute('tar', ['-xzOf', artifact.archive, './deploy-files.sha256']);
  assert.equal(artifact.integrity.files, 8);
  assert.equal(artifact.integrity.checklistSha256, createHash('sha256').update(checklist).digest('hex'));
  assert.equal(artifact.integrity.metadataSha256, createHash('sha256').update(metadataText).digest('hex'));
  assert.equal(checklist.trim().split('\n').length, 7);
  assert.match(checklist, /  deploy-manifest.json\n/);
  await assert.rejects(access(path.join(directory, 'release.json')), { code: 'ENOENT' });
  await assert.rejects(access(path.join(directory, 'deploy-manifest.json')), { code: 'ENOENT' });
  await artifact.cleanup();
  await assert.rejects(access(artifact.archive), { code: 'ENOENT' });
});

test('build content changes affect the digest even for the same Git SHA', async (t) => {
  const directory = await fixture(t);
  const first = await createArtifact({ directory, context, builtAt });
  t.after(first.cleanup);
  await writeFile(path.join(directory, 'assets/app.js'), 'console.log("different uncommitted changes")');
  const second = await createArtifact({ directory, context, builtAt });
  t.after(second.cleanup);
  assert.equal(first.metadata.commit, second.metadata.commit);
  assert.notEqual(first.metadata.contentSha256, second.metadata.contentSha256);
  assert.notEqual(first.sha256, second.sha256);
});

for (const reserved of ['release.json', 'deploy-manifest.json', 'deploy-files.sha256']) {
  test(`rejects preexisting reserved metadata: ${reserved}`, async (t) => {
    const directory = await fixture(t);
    await writeFile(path.join(directory, reserved), '{}');
    await assert.rejects(createArtifact({ directory, context, builtAt }), /배포용 예약 파일/);
  });
}

test('reads the actual installed package versions from this working tree', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const actual = await readBuildContext(root);
  const installed = JSON.parse(await readFile(path.join(root, 'node_modules/@owp/datagrid/package.json'), 'utf8'));
  assert.equal(actual.packages['@owp/datagrid'], installed.version);
  assert.match(actual.commit, /^[0-9a-f]{7,40}$/);
  assert.match(actual.fingerprint, /^[0-9a-f]{64}$/);
});

test('rejects paths that cannot be represented in the server checksum contract', async (t) => {
  const directory = await fixture(t);
  await writeFile(path.join(directory, 'assets/unsupported name.js'), 'content');
  await assert.rejects(createArtifact({ directory, context, builtAt }), /지원하지 않는 파일 경로/);
});

test('includes an ordinary file named __proto__ in the integrity list', async (t) => {
  const directory = await fixture(t);
  await writeFile(path.join(directory, '__proto__'), 'ordinary static file');
  const artifact = await createArtifact({ directory, context, builtAt });
  t.after(artifact.cleanup);
  const { stdout } = await execute('tar', ['-xzOf', artifact.archive, './deploy-files.sha256']);
  assert.match(stdout, /  __proto__\n/);
  assert.equal(artifact.integrity.files, 9);
});
