import assert from 'node:assert/strict';
import { readFile, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { validateBuild } from '../deploy-build.mjs';
import { validateArchivedBuild } from '../version-archive-build.ts';
import { archivePlaygroundBuild, VersionArchiveError } from '../version-archive.ts';
import { archiveFixture, metadata, writeBuild } from './version-archive-fixture.mjs';

const code = (expected) => (error) => error instanceof VersionArchiveError && error.code === expected;
async function fixture(t) {
  const data = await archiveFixture(t);
  const release = metadata();
  const directory = await writeBuild(path.join(data.root, 'dist'), release);
  return { ...data, release, directory };
}

test('accepts version-prefixed asset URLs without weakening the root deployment validator', async (t) => {
  const data = await fixture(t);
  assert.deepEqual(await validateArchivedBuild(data.directory, data.release.basePath), [{ id: 'datagrid', name: '@owp/datagrid', version: '3.5.0' }]);
  await assert.rejects(validateBuild(data.directory));
});

test('rejects root asset URLs that would escape the immutable release', async (t) => {
  const data = await fixture(t);
  await writeFile(path.join(data.directory, 'index.html'), '<script src="/assets/app.js"></script>');
  await assert.rejects(validateArchivedBuild(data.directory, data.release.basePath), code('UNSAFE_PATH'));
});

test('rejects a ready package whose dataset file is missing', async (t) => {
  const data = await fixture(t);
  await rm(path.join(data.directory, 'api/datagrid.json'));
  await assert.rejects(archivePlaygroundBuild(data), code('INVALID_DATA'));
});

test('rejects a ready package whose dataset has a missing API reference', async (t) => {
  const data = await fixture(t);
  const file = path.join(data.directory, 'api/datagrid.json');
  const dataset = JSON.parse(await readFile(file, 'utf8'));
  dataset.records[0].related.push('@owp/datagrid:Missing');
  await writeFile(file, JSON.stringify(dataset));
  await assert.rejects(archivePlaygroundBuild(data), code('INVALID_DATA'));
});

test('rejects a planned package accidentally advertised as available knowledge', async (t) => {
  const data = await fixture(t);
  const file = path.join(data.directory, 'knowledge/index.json');
  const index = JSON.parse(await readFile(file, 'utf8'));
  index.packages.push({ id: 'theme', name: '@owp/theme', version: '2.1.0' });
  await writeFile(file, JSON.stringify(index));
  await assert.rejects(archivePlaygroundBuild(data), code('INVALID_DATA'));
});

test('rejects a missing snippet and a symlink inserted into the built site', async (t) => {
  const data = await fixture(t);
  await rm(path.join(data.directory, 'snippets/datagrid/example.tsx'));
  await symlink(path.join(data.directory, 'index.html'), path.join(data.directory, 'snippets/datagrid/example.tsx'));
  await assert.rejects(archivePlaygroundBuild(data), code('UNSAFE_PATH'));
});

test('accepts generic ready package IDs only after their complete dataset and source catalog exist', async (t) => {
  const data = await archiveFixture(t);
  const release = metadata();
  const directory = await writeBuild(path.join(data.root, 'dist'), release, [{ id: 'future-grid', name: '@owp/future-grid', version: '1.0.0-rc.1' }]);
  assert.deepEqual(await validateArchivedBuild(directory, release.basePath), [{ id: 'future-grid', name: '@owp/future-grid', version: '1.0.0-rc.1' }]);
});
