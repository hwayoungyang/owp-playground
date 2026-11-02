import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import test from 'node:test';
import { prepareMcpBundle } from '../deploy-mcp-bundle.mjs';
import { inspectMcpTar, sha256 } from '../deploy-mcp-tar.mjs';
import { mcpFixture, tarBytes, writeFixtureMetadata } from './deploy-mcp-fixture.mjs';
import { createMcpDeploymentBundle } from '../prepare-mcp-bundle.mjs';
import { writeBuild } from './version-archive-fixture.mjs';
import { archivePlaygroundBuild } from '../version-archive-write.ts';

const execute = promisify(execFile);

test('Given a clean stable bundle, When prepared, Then private copies and every archive fingerprint are verified', async (t) => {
  const fixture = await mcpFixture(t);
  const prepared = await prepareMcpBundle(fixture.bundle);
  t.after(prepared.cleanup);
  assert.equal(prepared.manifest.releaseId, prepared.metadata.releaseId);
  assert.equal(prepared.index.latestReleaseId, prepared.metadata.releaseId);
  await writeFile(path.join(fixture.bundle, 'app.tar.gz'), 'changed after freezing');
  assert.equal(sha256(await readFile(path.join(prepared.directory, 'app.tar.gz'))), prepared.metadata.files['app.tar.gz'].sha256);
});
for (const mutation of ['forged-hash', 'draft', 'dirty', 'wrong-comment', 'missing-cli', 'changed-manifest']) {
  test(`Given ${mutation}, When preparing the bundle, Then validation fails before networking`, async (t) => {
    const fixture = await mcpFixture(t);
    const release = JSON.parse(await readFile(path.join(fixture.bundle, 'release.json')));
    if (mutation === 'forged-hash') release.files['app.tar.gz'].sha256 = 'a'.repeat(64);
    if (mutation === 'draft') release.channel = 'draft';
    if (mutation === 'dirty') release.dirty = true;
    if (mutation === 'wrong-comment' || mutation === 'missing-cli') {
      const bytes = tarBytes(mutation === 'missing-cli' ? fixture.sourceEntries.filter((entry) => entry.name !== 'mcp/cli.ts') : fixture.sourceEntries, 'a'.repeat(40));
      await writeFile(path.join(fixture.bundle, 'app.tar.gz'), bytes);
      release.files['app.tar.gz'] = { bytes: bytes.length, sha256: sha256(bytes) };
    }
    if (mutation === 'changed-manifest') release.packages[0].version = '9.0.0';
    await writeFixtureMetadata(fixture.bundle, release);
    await assert.rejects(prepareMcpBundle(fixture.bundle));
  });
}
for (const [name, entries] of [
  ['traversal', [{ name: '../outside', content: 'x' }]],
  ['absolute', [{ name: '/tmp/outside', content: 'x' }]],
  ['space', [{ name: 'has space', content: 'x' }]],
  ['control', [{ name: 'has\nnewline', content: 'x' }]],
  ['symlink', [{ name: 'link', type: '2' }]],
  ['hardlink', [{ name: 'link', type: '1' }]],
  ['special', [{ name: 'device', type: '3' }]],
  ['duplicate', [{ name: 'file', content: 'a' }, { name: 'file', content: 'b' }]],
  ['parent-file', [{ name: 'parent', content: 'a' }, { name: 'parent/file', content: 'b' }]],
  ['PAX-path-override', [{ name: 'pax', type: 'x', content: '19 path=../outside\n' }]],
]) test(`Given a tar with ${name}, When inspected, Then extraction is refused`, () => {
  assert.throws(() => inspectMcpTar(tarBytes(entries)));
});
test('Given a symlink bundle directory, When preparing, Then the link is rejected', async (t) => {
  const fixture = await mcpFixture(t);
  const target = path.join(fixture.root, 'linked-bundle');
  await symlink(fixture.bundle, target);
  await assert.rejects(prepareMcpBundle(target), /디렉터리/);
});

test('creates and reuses a bundle from the exact clean Git commit and preserves tampered prior material', async (t) => {
  const fixture = await mcpFixture(t);
  const repoRoot = path.join(fixture.root, 'source');
  await mkdir(repoRoot);
  for (const entry of fixture.sourceEntries) {
    const file = path.join(repoRoot, entry.name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, entry.content);
  }
  for (const args of [['init', '-q'], ['add', '.'], ['-c', 'user.name=Deployment Test', '-c', 'user.email=deployment@example.test', 'commit', '-qm', 'fixture']]) {
    await execute('git', args, { cwd: repoRoot });
  }
  const { stdout } = await execute('git', ['rev-parse', 'HEAD'], { cwd: repoRoot });
  const commit = stdout.trim();
  const releaseId = `20261103-030000-${commit.slice(0, 12)}`;
  const release = { schemaVersion: 1, releaseId, createdAt: '2026-11-02T18:00:00.000Z', appVersion: '0.1.0', commit: commit.slice(0, 12), channel: 'stable', dirty: false, basePath: `/versions/${releaseId}/` };
  const build = path.join(fixture.root, 'new-build');
  const archiveRoot = path.join(fixture.root, 'new-archive');
  await writeBuild(build, release);
  await archivePlaygroundBuild({ archiveRoot, directory: build, release });
  const options = { repoRoot, archiveRoot, releaseId, outputRoot: path.join(fixture.root, 'output') };
  const directory = await createMcpDeploymentBundle(options);
  assert.deepEqual((await readdir(directory)).sort(), ['SHA256SUMS', 'app.tar.gz', 'archive.tar.gz', 'release.json']);
  assert.equal(await createMcpDeploymentBundle(options), directory);
  const verified = await prepareMcpBundle(directory);
  t.after(verified.cleanup);
  assert.equal(verified.metadata.head, commit);
  assert.equal(verified.metadata.releaseId, releaseId);
  assert.deepEqual(verified.metadata.stableReleaseIds, [releaseId]);
  await writeFile(path.join(directory, 'app.tar.gz'), 'tampered');
  await assert.rejects(createMcpDeploymentBundle(options), /SHA|크기/);
  assert.equal(await readFile(path.join(directory, 'app.tar.gz'), 'utf8'), 'tampered');
  await writeFile(path.join(repoRoot, 'uncommitted.txt'), 'dirty');
  await assert.rejects(createMcpDeploymentBundle(options), /clean commit/);
});
