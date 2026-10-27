import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { createArtifact } from '../deploy-artifact.mjs';
import { validateMcpArchive } from '../deploy-mcp-bundle.mjs';
import { validateVersionPresentation } from '../deploy-version-presentation.mjs';
import { archivePlaygroundBuild, readVersionArchive } from '../version-archive.ts';
import { archiveFixture, metadata, writeBuild } from './version-archive-fixture.mjs';

const execute = promisify(execFile);
async function fixture(t) {
  const state = await archiveFixture(t);
  const release = metadata('20261023-120000-0123456789ab', { channel: 'stable', dirty: false });
  const archiveBuild = await writeBuild(path.join(state.root, 'archive-build'), release);
  await archivePlaygroundBuild({ archiveRoot: state.archiveRoot, directory: archiveBuild, release });
  const directory = await writeBuild(path.join(state.root, 'dist'), { basePath: '/' });
  const artifact = await createArtifact({ directory, archiveRoot: state.archiveRoot, context: { commit: '0123456789ab', dirty: true, packages: {} } });
  t.after(artifact.cleanup);
  const content = path.join(state.root, 'content');
  await mkdir(content);
  await execute('tar', ['-xzf', artifact.archive, '-C', content]);
  return { ...state, release, content, directory };
}

test('Given projected deployment HTML, When using the canonical reader, Then its original archive hash contract still rejects the projection', async (t) => {
  // Given
  const state = await fixture(t);
  // When / Then
  await assert.rejects(readVersionArchive(state.content), (error) => error.code === 'INTEGRITY_MISMATCH');
  assert.equal((await validateVersionPresentation(state.content)).latestReleaseId, state.release.releaseId);
});

for (const target of ['raw', 'presentation', 'snippet', 'runtime']) {
  test(`Given a modified ${target}, When validating the deployment presentation, Then the separate integrity contract rejects it`, async (t) => {
    // Given
    const state = await fixture(t);
    const paths = {
      raw: `version-ui/raw/${state.release.releaseId}/index.html`,
      presentation: `versions/${state.release.releaseId}/index.html`,
      snippet: `versions/${state.release.releaseId}/snippets/datagrid/example.tsx`,
      runtime: 'assets/version-menu-fixture.js',
    };
    const file = path.join(state.content, paths[target]);
    await writeFile(file, Buffer.concat([await readFile(file), Buffer.from('tamper')]));
    // When / Then
    await assert.rejects(validateVersionPresentation(state.content));
  });
}

test('Given a valid older bundle without a runtime provider, When preparing it for the new MCP presentation server, Then it fails before deployment', async (t) => {
  // Given
  const state = await archiveFixture(t);
  const release = metadata('20261023-120000-0123456789ab', { channel: 'stable', dirty: false });
  const directory = await writeBuild(path.join(state.root, 'old-build'), release);
  await rm(path.join(directory, 'version-ui/runtime.json'));
  const entry = await archivePlaygroundBuild({ archiveRoot: state.archiveRoot, directory, release });
  // When / Then
  await assert.rejects(validateMcpArchive(state.archiveRoot, {
    releaseId: release.releaseId, head: `${release.commit}0`.padEnd(40, '0'),
    stableReleaseIds: [release.releaseId], manifestCommit: release.commit, packages: entry.packages,
  }));
  assert.equal((await readVersionArchive(state.archiveRoot)).latestReleaseId, release.releaseId);
});
