import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  archivePlaygroundBuild, readArchivedFile, readArchivedPackage, readArchivedRelease,
  readVersionArchive, VersionArchiveError,
} from '../version-archive.ts';
import { archiveFixture, fingerprint, metadata, writeBuild } from './version-archive-fixture.mjs';

const code = (expected) => (error) => error instanceof VersionArchiveError && error.code === expected;
async function publish(t, release = metadata(), packages) {
  const fixture = await archiveFixture(t);
  const directory = await writeBuild(path.join(fixture.root, 'dist'), release, packages);
  const entry = await archivePlaygroundBuild({ ...fixture, directory, release });
  return { ...fixture, directory, release, entry };
}

test('archives a complete draft and reads only its registered ready package', async (t) => {
  const fixture = await publish(t);
  const index = await readVersionArchive(fixture.archiveRoot);
  const { release, dataset } = await readArchivedPackage(fixture.archiveRoot, { releaseId: index.latestReleaseId, packageId: 'datagrid', version: '3.5.0' });
  assert.equal(dataset.records[0].packageVersion, '3.5.0');
  assert.deepEqual(release.manifest.packages, [{ id: 'datagrid', name: '@owp/datagrid', version: '3.5.0' }]);
  assert.equal(release.manifest.dirty, true);
  assert.equal(release.manifest.channel, 'draft');
  assert.equal(Object.hasOwn(release.manifest.files, 'knowledge-release.json'), false);
  assert.equal((await readArchivedFile(release, 'assets/app.js')).toString(), 'document.body.dataset.ready = "true";');
  await assert.rejects(readArchivedPackage(fixture.archiveRoot, { releaseId: index.latestReleaseId, packageId: 'theme' }), code('PACKAGE_NOT_FOUND'));
  await assert.rejects(readArchivedPackage(fixture.archiveRoot, { releaseId: index.latestReleaseId, packageId: 'datagrid', version: '3.4.0' }), code('VERSION_MISMATCH'));
});

test('rejects duplicate release IDs without changing the original manifest or latest pointer', async (t) => {
  const fixture = await publish(t);
  const indexFile = path.join(fixture.archiveRoot, 'versions/index.json');
  const original = await readFile(indexFile);
  await assert.rejects(archivePlaygroundBuild(fixture), code('RELEASE_EXISTS'));
  assert.deepEqual(await readFile(indexFile), original);
  assert.equal((await readArchivedRelease(fixture.archiveRoot, fixture.release.releaseId)).entry.manifestSha256, fixture.entry.manifestSha256);
});

test('preserves older releases and selects latest when package versions and available packages differ', async (t) => {
  const fixture = await publish(t);
  const second = metadata('20261023-120001-0123456789ab');
  const packages = [{ id: 'datagrid', name: '@owp/datagrid', version: '3.6.0' }, { id: 'charts', name: '@owp/charts', version: '5.0.1' }];
  const directory = await writeBuild(path.join(fixture.root, 'second'), second, packages);
  await archivePlaygroundBuild({ archiveRoot: fixture.archiveRoot, directory, release: second });
  const index = await readVersionArchive(fixture.archiveRoot);
  assert.equal(index.latestReleaseId, second.releaseId);
  assert.equal(index.releases.length, 2);
  assert.equal((await readArchivedPackage(fixture.archiveRoot, { releaseId: fixture.release.releaseId, packageId: 'datagrid' })).dataset.version, '3.5.0');
  assert.equal((await readArchivedPackage(fixture.archiveRoot, { releaseId: second.releaseId, packageId: 'datagrid' })).dataset.version, '3.6.0');
});

test('rejects tampered file bytes even when file size is unchanged', async (t) => {
  const fixture = await publish(t);
  await writeFile(path.join(fixture.archiveRoot, 'versions', fixture.release.releaseId, 'assets/app.js'), 'document.body.dataset.ready = "evil";');
  await assert.rejects(readVersionArchive(fixture.archiveRoot), code('INTEGRITY_MISMATCH'));
});

test('rejects index manifest SHA tampering', async (t) => {
  const fixture = await publish(t);
  const indexFile = path.join(fixture.archiveRoot, 'versions/index.json');
  const index = JSON.parse(await readFile(indexFile, 'utf8'));
  index.releases[0].manifestSha256 = '0'.repeat(64);
  await writeFile(indexFile, JSON.stringify(index));
  await assert.rejects(readVersionArchive(fixture.archiveRoot), code('INTEGRITY_MISMATCH'));
});

test('rejects a traversal path even if the attacker recalculates the manifest hash', async (t) => {
  const fixture = await publish(t);
  const indexFile = path.join(fixture.archiveRoot, 'versions/index.json');
  const manifestFile = path.join(fixture.archiveRoot, 'versions', fixture.release.releaseId, 'knowledge-release.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  manifest.files['../outside'] = { bytes: 1, sha256: '0'.repeat(64) };
  const bytes = JSON.stringify(manifest);
  await writeFile(manifestFile, bytes);
  const index = JSON.parse(await readFile(indexFile, 'utf8'));
  index.releases[0].manifestSha256 = fingerprint(bytes);
  await writeFile(indexFile, JSON.stringify(index));
  await assert.rejects(readVersionArchive(fixture.archiveRoot), code('INVALID_DATA'));
});

test('rejects an archive file replaced with a symlink', async (t) => {
  const fixture = await publish(t);
  const asset = path.join(fixture.archiveRoot, 'versions', fixture.release.releaseId, 'assets/app.js');
  await rm(asset);
  await symlink(path.join(fixture.directory, 'assets/app.js'), asset);
  await assert.rejects(readVersionArchive(fixture.archiveRoot), code('UNSAFE_PATH'));
});

test('keeps latest unchanged and removes staging when the atomic index commit fails', async (t) => {
  const fixture = await publish(t);
  const indexFile = path.join(fixture.archiveRoot, 'versions/index.json');
  const original = await readFile(indexFile);
  const second = metadata('20261023-120002-0123456789ab');
  const directory = await writeBuild(path.join(fixture.root, 'second'), second);
  const destination = path.join(fixture.archiveRoot, 'versions', second.releaseId);
  await assert.rejects(archivePlaygroundBuild({ archiveRoot: fixture.archiveRoot, directory, release: second }, {
    commitIndex: async () => { throw new VersionArchiveError('INVALID_DATA', '테스트 인덱스 교체 실패'); },
  }), code('INVALID_DATA'));
  assert.deepEqual(await readFile(indexFile), original);
  assert.equal((await readdir(fixture.archiveRoot)).some((file) => file.startsWith('.staging-') || file === '.archive.lock'), false);
  await assert.rejects(readFile(path.join(destination, 'knowledge-release.json')), { code: 'ENOENT' });
  assert.equal((await readVersionArchive(fixture.archiveRoot)).latestReleaseId, fixture.release.releaseId);
});

test('rejects concurrent writers through the archive lock', async (t) => {
  const fixture = await archiveFixture(t);
  await mkdir(path.join(fixture.archiveRoot, '.archive.lock'), { recursive: true });
  await assert.rejects(archivePlaygroundBuild({ archiveRoot: fixture.archiveRoot, directory: fixture.root, release: metadata() }), code('ARCHIVE_LOCKED'));
});

test('rejects a symlink used as archive root before writing through it', async (t) => {
  const fixture = await archiveFixture(t);
  await mkdir(path.join(fixture.root, 'outside'));
  await symlink(path.join(fixture.root, 'outside'), fixture.archiveRoot);
  await assert.rejects(archivePlaygroundBuild({ archiveRoot: fixture.archiveRoot, directory: fixture.root, release: metadata() }), code('UNSAFE_PATH'));
  assert.deepEqual(await readdir(path.join(fixture.root, 'outside')), []);
});

test('hashes ordinary files named __proto__ without inheriting nonexistent allowlist entries', async (t) => {
  const fixture = await archiveFixture(t);
  const release = metadata();
  const directory = await writeBuild(path.join(fixture.root, 'dist'), release);
  await writeFile(path.join(directory, '__proto__'), 'ordinary static file');
  await archivePlaygroundBuild({ ...fixture, directory, release });
  const archived = await readArchivedRelease(fixture.archiveRoot, release.releaseId);
  assert.equal(Object.hasOwn(archived.manifest.files, '__proto__'), true);
  assert.equal((await readArchivedFile(archived, '__proto__')).toString(), 'ordinary static file');
  await assert.rejects(readArchivedFile(archived, 'constructor'), code('UNSAFE_PATH'));
  await assert.rejects(readArchivedFile(archived, '../outside'), code('UNSAFE_PATH'));
});
