import { rm, symlink, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createKnowledgeStore } from '../mcp/knowledge.ts';
import { createMcpFixture, source } from '../mcp/test-fixture.ts';

let root: string;
beforeEach(async () => {
  root = await createMcpFixture();
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('MCP Knowledge core', () => {
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
