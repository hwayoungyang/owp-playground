import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { snapshotPlayground as createSnapshot } from '../version-archive-snapshot.mjs';
import { snapshotInputFingerprint } from '../version-archive-context.mjs';
import { readArchivedRelease, readVersionArchive, VersionArchiveError } from '../version-archive.ts';
import { archiveFixture, metadata, writeBuild } from './version-archive-fixture.mjs';

const execute = promisify(execFile);
const snapshotPlayground = (options, dependencies) => createSnapshot(options, { prepare: async () => {}, ...dependencies });
const now = () => new Date('2026-10-23T03:00:00.000Z');
const context = (overrides = {}) => ({
  commit: '0123456789ab', dirty: true, packages: { '@owp/datagrid': '3.5.0', '@owp/theme': '2.1.0' },
  fingerprint: 'a'.repeat(64), ...overrides,
});
const code = (expected) => (error) => error instanceof VersionArchiveError && error.code === expected;

test('defaults dirty source to draft and passes actual release metadata to the build environment', async (t) => {
  const fixture = await archiveFixture(t);
  await writeFile(path.join(fixture.root, 'package.json'), '{"version":"0.1.0"}');
  let received;
  const entry = await snapshotPlayground({ repoRoot: fixture.root, archiveRoot: fixture.archiveRoot }, {
    now, readContext: async () => context(),
    build: async (env) => {
      received = env;
      await writeBuild(env.OWP_BUILD_OUT_DIR, metadata(env.OWP_RELEASE_ID));
    },
  });
  assert.equal(entry.channel, 'draft');
  assert.equal(received.OWP_PUBLIC_BASE, entry.basePath);
  assert.equal(received.OWP_RELEASE_ID, entry.releaseId);
  assert.equal(received.OWP_RELEASE_CREATED_AT, now().toISOString());
  assert.equal(received.OWP_RELEASE_COMMIT, context().commit);
  assert.equal(received.OWP_RELEASE_DIRTY, 'true');
  assert.equal(received.OWP_RELEASE_APP_VERSION, '0.1.0');
  assert.equal((await readArchivedRelease(fixture.archiveRoot, entry.releaseId)).manifest.dirty, true);
});

test('rejects explicit stable from a dirty Git tree before running the build', async (t) => {
  const fixture = await archiveFixture(t);
  let buildCalls = 0;
  await assert.rejects(snapshotPlayground({ repoRoot: fixture.root, archiveRoot: fixture.archiveRoot, channel: 'stable' }, {
    now, readContext: async () => context(), build: async () => { buildCalls += 1; },
  }), code('STABLE_REQUIRES_CLEAN_TREE'));
  assert.equal(buildCalls, 0);
  assert.deepEqual(await readdir(fixture.archiveRoot), []);
});

test('defaults clean source to stable while allowing an explicit draft', async (t) => {
  for (const channel of [undefined, 'draft']) {
    const fixture = await archiveFixture(t);
    await writeFile(path.join(fixture.root, 'package.json'), '{"version":"0.1.0"}');
    const entry = await snapshotPlayground({ repoRoot: fixture.root, archiveRoot: fixture.archiveRoot, ...(channel ? { channel } : {}) }, {
      now, readContext: async () => context({ dirty: false }),
      build: async (env) => writeBuild(env.OWP_BUILD_OUT_DIR, metadata(env.OWP_RELEASE_ID)),
    });
    assert.equal(entry.channel, channel ?? 'stable');
    assert.equal((await readArchivedRelease(fixture.archiveRoot, entry.releaseId)).manifest.dirty, false);
  }
});

test('keeps the previous latest pointer when the source changes during a build', async (t) => {
  const fixture = await archiveFixture(t);
  await writeFile(path.join(fixture.root, 'package.json'), '{"version":"0.1.0"}');
  const dependencies = {
    now, readContext: async () => context(),
    build: async (env) => writeBuild(env.OWP_BUILD_OUT_DIR, metadata(env.OWP_RELEASE_ID)),
  };
  const entry = await snapshotPlayground({ repoRoot: fixture.root, archiveRoot: fixture.archiveRoot }, dependencies);
  const original = await readFile(path.join(fixture.archiveRoot, 'versions/index.json'));
  let reads = 0;
  await assert.rejects(snapshotPlayground({ repoRoot: fixture.root, archiveRoot: fixture.archiveRoot }, {
    ...dependencies,
    now: () => new Date('2026-10-23T03:00:01.000Z'),
    readContext: async () => context({ fingerprint: (++reads === 1 ? 'a' : 'b').repeat(64) }),
  }), code('BUILD_CONTEXT_CHANGED'));
  assert.deepEqual(await readFile(path.join(fixture.archiveRoot, 'versions/index.json')), original);
  assert.equal((await readVersionArchive(fixture.archiveRoot)).latestReleaseId, entry.releaseId);
});

test('rejects build datasets whose version differs from the actual installed context', async (t) => {
  const fixture = await archiveFixture(t);
  await writeFile(path.join(fixture.root, 'package.json'), '{"version":"0.1.0"}');
  await assert.rejects(snapshotPlayground({ repoRoot: fixture.root, archiveRoot: fixture.archiveRoot }, {
    now, readContext: async () => context({ packages: { '@owp/datagrid': '3.6.0' } }),
    build: async (env) => writeBuild(env.OWP_BUILD_OUT_DIR, metadata(env.OWP_RELEASE_ID)),
  }), code('BUILD_CONTEXT_CHANGED'));
  await assert.rejects(readVersionArchive(fixture.archiveRoot), code('ARCHIVE_NOT_FOUND'));
});

test('CLI rejects conflicting channels before it starts a build', async () => {
  await assert.rejects(execute(process.execPath, ['--experimental-strip-types', 'scripts/snapshot-playground.mjs', '--draft', '--stable']), { code: 1 });
});

test('CLI help exits without running a build', async () => {
  const result = await execute(process.execPath, ['--experimental-strip-types', 'scripts/snapshot-playground.mjs', '--help']);
  assert.match(result.stdout, /--draft \| --stable/);
});

test('includes Knowledge adapters and build scripts in the source fingerprint', async (t) => {
  const fixture = await archiveFixture(t);
  await mkdir(path.join(fixture.root, 'scripts'));
  await mkdir(path.join(fixture.root, 'knowledge'));
  await writeFile(path.join(fixture.root, 'scripts/generate-knowledge.mjs'), 'export const count = 1;');
  await writeFile(path.join(fixture.root, 'knowledge/package-adapters.mjs'), 'export const adapters = [];');
  const first = await snapshotInputFingerprint(fixture.root, 'a'.repeat(64));
  await writeFile(path.join(fixture.root, 'knowledge/package-adapters.mjs'), 'export const adapters = ["datagrid"];');
  const changedAdapter = await snapshotInputFingerprint(fixture.root, 'a'.repeat(64));
  assert.notEqual(changedAdapter, first);
  await writeFile(path.join(fixture.root, 'scripts/generate-knowledge.mjs'), 'export const count = 2;');
  assert.notEqual(await snapshotInputFingerprint(fixture.root, 'a'.repeat(64)), changedAdapter);
});

test('prepares Knowledge before capturing context and preserves the normal dist directory', async (t) => {
  const fixture = await archiveFixture(t);
  await writeFile(path.join(fixture.root, 'package.json'), '{"version":"0.1.0"}');
  await mkdir(path.join(fixture.root, 'dist'));
  await writeFile(path.join(fixture.root, 'dist/sentinel.txt'), 'existing build');
  const events = [];
  await snapshotPlayground({ repoRoot: fixture.root, archiveRoot: fixture.archiveRoot }, {
    now, prepare: async () => { events.push('prepare'); },
    readContext: async () => { events.push('context'); return context(); },
    build: async (env) => { events.push('build'); await writeBuild(env.OWP_BUILD_OUT_DIR, metadata(env.OWP_RELEASE_ID)); },
  });
  assert.deepEqual(events, ['prepare', 'context', 'build', 'context']);
  assert.equal(await readFile(path.join(fixture.root, 'dist/sentinel.txt'), 'utf8'), 'existing build');
  assert.deepEqual(await readdir(fixture.archiveRoot), ['versions']);
});

test('reports actionable build stderr and removes the owned build directory after failure', async (t) => {
  const fixture = await archiveFixture(t);
  await writeFile(path.join(fixture.root, 'package.json'), '{"version":"0.1.0"}');
  await assert.rejects(snapshotPlayground({ repoRoot: fixture.root, archiveRoot: fixture.archiveRoot }, {
    now, readContext: async () => context(),
    build: async () => execute(process.execPath, ['-e', 'console.error("TS9999"); process.exit(1)']),
  }), (error) => code('BUILD_FAILED')(error) && error.message.includes('TS9999'));
  assert.deepEqual(await readdir(fixture.archiveRoot), []);
});
