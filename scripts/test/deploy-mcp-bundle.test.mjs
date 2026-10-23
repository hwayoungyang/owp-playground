import assert from 'node:assert/strict';
import { readFile, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { prepareMcpBundle } from '../deploy-mcp-bundle.mjs';
import { inspectMcpTar, sha256 } from '../deploy-mcp-tar.mjs';
import { mcpFixture, tarBytes, writeFixtureMetadata } from './deploy-mcp-fixture.mjs';

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
