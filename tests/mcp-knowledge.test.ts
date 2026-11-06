import { readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createKnowledgeStore } from '../mcp/knowledge.ts';
import { createKnowledgeArchive } from '../mcp/knowledge-archive.ts';
import { createMcpFixture, hash, source } from '../mcp/test-fixture.ts';
import * as archiveFiles from '../scripts/version-archive-files.ts';
import { knowledgeReleaseSchema, releaseIndexSchema } from '../src/features/releases/model/schema';

let root: string;
beforeEach(async () => {
  root = await createMcpFixture();
});
afterEach(async () => {
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});

function signal() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function synchronizeIndexReads(requests: number) {
  const read = archiveFiles.readArchiveBytes;
  const ready = signal();
  let arrived = 0;
  vi.spyOn(archiveFiles, 'readArchiveBytes').mockImplementation(async (directory, file) => {
    const bytes = await read(directory, file);
    if (file === 'versions/index.json') {
      arrived += 1;
      if (arrived === requests) ready.resolve();
      await ready.promise;
    }
    return bytes;
  });
}

describe('MCP Knowledge core', () => {
  it('shares one complete verification when cold requests read the same index', async () => {
    // Given
    synchronizeIndexReads(4);
    const scans = vi.spyOn(archiveFiles, 'collectArchiveFiles');
    const archive = createKnowledgeArchive({ archiveRoot: root });
    // When
    const selections = await Promise.all(
      Array.from({ length: 4 }, () => archive.resolve({ package: 'datagrid' })),
    );
    // Then
    expect(selections.map(({ entry }) => entry.releaseId)).toEqual(
      Array.from({ length: 4 }, () => 'release-new'),
    );
    expect(scans.mock.calls.map(([directory]) => path.basename(directory))).toEqual([
      'release-old',
      'release-new',
      'release-draft',
    ]);
  });
  it('reuses the fully verified release when a package is selected again', async () => {
    // Given
    const scans = vi.spyOn(archiveFiles, 'collectArchiveFiles');
    const store = createKnowledgeStore({ archiveRoot: root });
    // When
    const responses = [
      await store.getGuide({ package: 'datagrid' }),
      await store.getGuide({ package: 'charts' }),
      await store.getGuide({ package: 'datagrid' }),
    ];
    // Then
    expect(responses.map(({ packageVersion }) => packageVersion)).toEqual([
      '2.0.0',
      '2.0.0',
      '2.0.0',
    ]);
    expect(scans).toHaveBeenCalledTimes(3);
  });
  it('retries the same index after a shared verification fails and archive bytes are repaired', async () => {
    // Given
    const file = path.join(root, 'versions/release-old/index.html');
    const original = await readFile(file);
    await writeFile(file, 'tampered');
    synchronizeIndexReads(4);
    const scans = vi.spyOn(archiveFiles, 'collectArchiveFiles');
    const archive = createKnowledgeArchive({ archiveRoot: root });
    // When
    const failures = await Promise.allSettled(
      Array.from({ length: 4 }, () => archive.resolve({ package: 'datagrid' })),
    );
    const failedScans = scans.mock.calls.length;
    await writeFile(file, original);
    const selection = await archive.resolve({ package: 'datagrid' });
    // Then
    expect(failures).toEqual(
      Array.from({ length: 4 }, () => ({
        status: 'rejected',
        reason: expect.objectContaining({ code: 'INTEGRITY_MISMATCH' }),
      })),
    );
    expect(selection.entry.releaseId).toBe('release-new');
    expect({ failedScans, repairedScans: scans.mock.calls.length - failedScans }).toEqual({
      failedScans: 1,
      repairedScans: 3,
    });
  });
  it('verifies all releases once again when the index fingerprint changes', async () => {
    // Given
    const archive = createKnowledgeArchive({ archiveRoot: root });
    await archive.resolve({ package: 'datagrid' });
    const indexFile = path.join(root, 'versions/index.json');
    const index = releaseIndexSchema.parse(JSON.parse(await readFile(indexFile, 'utf8')));
    await writeFile(indexFile, JSON.stringify({ ...index, latestReleaseId: 'release-old' }));
    synchronizeIndexReads(4);
    const scans = vi.spyOn(archiveFiles, 'collectArchiveFiles');
    // When
    const selections = await Promise.all(
      Array.from({ length: 4 }, () => archive.resolve({ package: 'datagrid' })),
    );
    // Then
    expect(selections.map(({ selected }) => selected?.version)).toEqual([
      '1.0.0',
      '1.0.0',
      '1.0.0',
      '1.0.0',
    ]);
    expect(scans).toHaveBeenCalledTimes(3);
  });
  it('keeps each index tied to its verified releases when validations finish in reverse order', async () => {
    // Given
    const indexFile = path.join(root, 'versions/index.json');
    const index = releaseIndexSchema.parse(JSON.parse(await readFile(indexFile, 'utf8')));
    await writeFile(indexFile, JSON.stringify({ ...index, latestReleaseId: 'release-old' }));
    const started = signal();
    const resume = signal();
    const collect = archiveFiles.collectArchiveFiles;
    const scans = vi
      .spyOn(archiveFiles, 'collectArchiveFiles')
      .mockImplementation(async (directory) => {
        if (scans.mock.calls.length === 1) {
          started.resolve();
          await resume.promise;
        }
        return collect(directory);
      });
    const archive = createKnowledgeArchive({ archiveRoot: root });
    const older = archive.resolve({ package: 'datagrid' });
    await started.promise;
    await writeFile(
      indexFile,
      JSON.stringify({
        ...index,
        latestReleaseId: 'release-new',
        releases: index.releases.filter(({ releaseId }) => releaseId !== 'release-old'),
      }),
    );
    // When
    const newer = await archive.resolve({ package: 'datagrid' });
    resume.resolve();
    const previous = await older;
    const completedScans = scans.mock.calls.length;
    const current = await archive.resolve({ package: 'datagrid' });
    // Then
    expect(
      [previous, newer, current].map(({ entry, release, selected }) => ({
        releaseId: entry.releaseId,
        manifestReleaseId: release.manifest.releaseId,
        version: selected?.version,
      })),
    ).toEqual([
      { releaseId: 'release-old', manifestReleaseId: 'release-old', version: '1.0.0' },
      { releaseId: 'release-new', manifestReleaseId: 'release-new', version: '2.0.0' },
      { releaseId: 'release-new', manifestReleaseId: 'release-new', version: '2.0.0' },
    ]);
    expect({ completedScans, finalScans: scans.mock.calls.length }).toEqual({
      completedScans: 5,
      finalScans: 5,
    });
  });
  it('verifies the exact index bytes used for the fingerprint when the index is replaced after reading', async () => {
    // Given
    const indexFile = path.join(root, 'versions/index.json');
    const index = releaseIndexSchema.parse(JSON.parse(await readFile(indexFile, 'utf8')));
    await writeFile(indexFile, JSON.stringify({ ...index, latestReleaseId: 'release-old' }));
    const read = archiveFiles.readArchiveBytes;
    let replaced = false;
    vi.spyOn(archiveFiles, 'readArchiveBytes').mockImplementation(async (directory, file) => {
      const bytes = await read(directory, file);
      if (file === 'versions/index.json' && !replaced) {
        replaced = true;
        await writeFile(indexFile, JSON.stringify({ ...index, latestReleaseId: 'release-new' }));
      }
      return bytes;
    });
    const archive = createKnowledgeArchive({ archiveRoot: root });
    // When
    const captured = await archive.resolve({ package: 'datagrid' });
    const current = await archive.resolve({ package: 'datagrid' });
    // Then
    expect(
      [captured, current].map(({ entry, release }) => [
        entry.releaseId,
        release.manifest.releaseId,
      ]),
    ).toEqual([
      ['release-old', 'release-old'],
      ['release-new', 'release-new'],
    ]);
  });
  it('verifies the canonical release entry when the public package list filters an unsupported package', async () => {
    // Given
    const manifestFile = path.join(root, 'versions/release-new/knowledge-release.json');
    const manifest = knowledgeReleaseSchema.parse(JSON.parse(await readFile(manifestFile, 'utf8')));
    const packages = [
      ...manifest.packages,
      { id: 'future-grid', name: '@owp/future-grid', version: '1.0.0' },
    ];
    const bytes = JSON.stringify({ ...manifest, packages });
    await writeFile(manifestFile, bytes);
    const indexFile = path.join(root, 'versions/index.json');
    const index = releaseIndexSchema.parse(JSON.parse(await readFile(indexFile, 'utf8')));
    await writeFile(
      indexFile,
      JSON.stringify({
        ...index,
        releases: index.releases.map((entry) =>
          entry.releaseId === manifest.releaseId
            ? { ...entry, packages, manifestSha256: hash(bytes) }
            : entry,
        ),
      }),
    );
    const store = createKnowledgeStore({ archiveRoot: root });
    // When
    const response = await store.listPackages({});
    // Then
    expect(response.releaseId).toBe('release-new');
    expect(response.packages.map((entry) => entry.id)).toEqual(['datagrid', 'charts']);
  });
  it('rejects encoded traversal when resolving an archive source URL', () => {
    // Given
    const store = createKnowledgeStore({
      archiveRoot: root,
      publicUrl: 'https://knowledge.example.test',
    });
    // When / Then
    expect(() => store.sourceUrl('release-new', '/%2e%2e/secret')).toThrow(
      expect.objectContaining({ code: 'UNSAFE_PATH' }),
    );
  });
  it('returns a typed actionable error when the archive index is missing', async () => {
    // Given
    await rm(path.join(root, 'versions/index.json'));
    const store = createKnowledgeStore({ archiveRoot: root });
    // When / Then
    await expect(store.listPackages({})).rejects.toMatchObject({ code: 'ARCHIVE_NOT_FOUND' });
  });
  it('matches words across API body and signature when the query has separate tokens', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    // When
    const response = await store.searchKnowledge({
      package: 'datagrid',
      query: 'contract Component',
      kind: 'api',
    });
    // Then
    expect(response.results.map((record) => record.id)).toEqual(['@owp/datagrid:OwpDataGrid']);
  });
  it('matches all example query tokens independently when their order differs from the title', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    // When
    const response = await store.searchKnowledge({
      package: 'datagrid',
      query: 'owp basic',
      kind: 'example',
    });
    // Then
    expect(response.results.map((record) => record.id)).toEqual(['basic']);
  });
  it('excludes examples when one query token is absent', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    // When
    const response = await store.searchKnowledge({
      package: 'datagrid',
      query: 'owp absent',
      kind: 'example',
    });
    // Then
    expect(response.results).toEqual([]);
  });
  it('returns the latest stable snapshot when version and release are omitted', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    // When
    const response = await store.listPackages({});
    // Then
    expect(response.releaseId).toBe('release-new');
    expect(response.packages.map((pkg) => pkg.id)).toEqual(['datagrid', 'charts']);
    expect(response.packages[0]?.version).toBe('2.0.0');
    expect(response.packages[0]?.availableVersions).toEqual(['1.0.0', '2.0.0']);
  });
  it('resolves an exact historical version when the normalized package name is supplied', async () => {
    // Given
    const store = createKnowledgeStore({
      archiveRoot: root,
      publicUrl: 'https://knowledge.example.test',
    });
    // When
    const response = await store.getApi({
      package: '@owp/datagrid',
      version: '1.0.0',
      symbol: 'OwpDataGrid',
    });
    // Then
    expect(response).toMatchObject({ releaseId: 'release-old', packageVersion: '1.0.0' });
    expect(response.sourceUrls).toEqual([
      'https://knowledge.example.test/versions/release-old/api/datagrid.json',
    ]);
    expect(response.record.url).toContain('/versions/release-old/?');
  });
  it('rejects a mismatched release and version when both are pinned', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    // When / Then
    await expect(
      store.getApi({
        package: 'datagrid',
        releaseId: 'release-new',
        version: '1.0.0',
        symbol: 'OwpDataGrid',
      }),
    ).rejects.toMatchObject({ code: 'VERSION_MISMATCH', availableVersions: ['1.0.0', '2.0.0'] });
  });
  it('returns availableVersions when an unknown exact version is requested', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    // When / Then
    await expect(
      store.getApi({ package: 'datagrid', version: '99.0.0', symbol: 'OwpDataGrid' }),
    ).rejects.toMatchObject({ code: 'VERSION_NOT_FOUND', availableVersions: ['1.0.0', '2.0.0'] });
  });
  it('rejects planned packages when a knowledge lookup is requested', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    // When / Then
    await expect(store.searchKnowledge({ package: 'core', query: 'OWP' })).rejects.toMatchObject({
      code: 'PACKAGE_NOT_FOUND',
    });
  });
  it('allows a draft snapshot when draft access is explicit', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root, allowDrafts: true });
    // When
    const response = await store.getGuide({ package: 'charts' });
    // Then
    expect(response).toMatchObject({
      releaseId: 'release-draft',
      packageVersion: '3.0.0',
      id: '@owp/charts:guide.composition',
    });
  });
  it('returns actual TSX and its verified dependency files when dependencies are requested', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    // When
    const response = await store.getExample({
      package: 'datagrid',
      exampleId: 'basic',
      includeDependencies: true,
    });
    // Then
    expect(response.files[0]?.content).toBe(source);
    expect(response.files).toHaveLength(2);
    expect(response.manifest[0]?.dependencies).toEqual([
      '/versions/release-new/snippets/playgrounds/datagrid/examples/types.ts',
    ]);
  });
  it('rejects arbitrary source paths when the path is outside the sample manifest', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    // When / Then
    await expect(
      store.getExample({ package: 'datagrid', exampleId: 'basic', file: '../../secret' }),
    ).rejects.toMatchObject({ code: 'FILE_NOT_ALLOWED' });
  });
  it('rejects tampered source bytes when the archive no longer matches its manifest', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    await store.getExample({ package: 'datagrid', exampleId: 'basic' });
    await writeFile(
      path.join(root, 'versions/release-new/snippets/playgrounds/datagrid/examples/basic.tsx'),
      'tampered',
    );
    // When / Then
    await expect(
      store.getExample({ package: 'datagrid', exampleId: 'basic' }),
    ).rejects.toMatchObject({ code: 'INTEGRITY_MISMATCH' });
  });
  it('continues at the next dependency when the shared content budget is exhausted', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    // When
    const response = await store.getExample({
      package: 'datagrid',
      exampleId: 'basic',
      includeDependencies: true,
      maxChars: 100,
    });
    // Then
    expect(response.files).toHaveLength(1);
    expect(response.files[0]?.truncated).toBe(false);
    expect(response.nextOffset).toBe(1);
  });
  it('rejects symlink sources when a file points outside the archive', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    const target = path.join(
      root,
      'versions/release-new/snippets/playgrounds/datagrid/examples/basic.tsx',
    );
    await unlink(target);
    await symlink('/etc/hosts', target);
    // When / Then
    await expect(
      store.getExample({ package: 'datagrid', exampleId: 'basic' }),
    ).rejects.toMatchObject({ code: 'UNSAFE_PATH' });
  });
  it('paginates bounded summaries when search matches APIs and examples', async () => {
    // Given
    const store = createKnowledgeStore({ archiveRoot: root });
    // When
    const response = await store.searchKnowledge({ package: 'charts', query: 'OWP', limit: 1 });
    // Then
    expect(response.results).toHaveLength(1);
    expect(response.total).toBe(3);
    expect(response.nextOffset).toBe(1);
  });
});
