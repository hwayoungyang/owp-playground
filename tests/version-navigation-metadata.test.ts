import { describe, expect, it, vi } from 'vitest';
import { createVersionUrl } from '../src/features/releases/model/navigation';
import { createNavigationMetadataLoader } from '../src/features/releases/model/navigation-metadata';
import { releaseIndexEntrySchema } from '../src/features/releases/model/schema';

const release = releaseIndexEntrySchema.parse({
  releaseId: 'target',
  createdAt: '2026-10-28T03:00:00.000Z',
  basePath: '/versions/target/',
  channel: 'stable',
  packages: [
    { id: 'core', name: '@owp/core', version: '10.2.0' },
    { id: 'datagrid', name: '@owp/datagrid', version: '3.5.3' },
  ],
  manifestSha256: '0'.repeat(64),
});
const record = {
  id: '@owp/core:known',
  package: '@owp/core',
  packageVersion: '10.2.0',
  owner: 'known',
  name: 'known',
  path: 'known',
  kind: 'function',
  imports: [],
  description: '',
  body: '',
  signature: '',
  requirement: 'declaration',
  related: [],
  guideIds: [],
  locale: 'ko',
  defaultDescription: null,
  usageNote: null,
  examples: [],
  source: { path: 'index.d.ts', line: 1, sha256: '0'.repeat(64) },
  sources: [],
  url: '',
  contentHash: '0'.repeat(64),
} as const;
const api = {
  schemaVersion: 1,
  id: 'core',
  name: '@owp/core',
  version: '10.2.0',
  dependencies: {},
  records: [record],
  referenceRecords: [
    {
      ...record,
      id: '@owp/components:reference',
      package: '@owp/components',
      owner: 'reference',
      name: 'reference',
      path: 'reference',
    },
  ],
  examples: [],
} as const;
const catalog = {
  package: '@owp/core',
  packageVersion: '10.2.0',
  samples: [{ id: 'settings' }],
} as const;
const request = {
  release,
  packageId: 'core',
  currentHref: 'https://owp.test/?package=core',
} as const;

describe('version navigation metadata', () => {
  it.each([
    ['', []],
    ['&sample=settings', ['/versions/target/catalogs/core.sources.json']],
    ['&symbol=missing', ['/versions/target/api/core.json']],
    [
      '&symbol=missing&sample=settings',
      ['/versions/target/api/core.json', '/versions/target/catalogs/core.sources.json'],
    ],
  ] as const)('requests only selected resources for %s', async (selection, paths) => {
    // Given
    const fetchMetadata = vi.fn(async (path: string) =>
      Response.json(path.includes('/api/') ? api : catalog),
    );
    const load = createNavigationMetadataLoader(fetchMetadata);
    // When
    const metadata = await load({ ...request, currentHref: request.currentHref + selection });
    // Then
    expect(fetchMetadata.mock.calls.map(([path]) => path)).toEqual(paths);
    expect(metadata.apiIds).toEqual(
      selection.includes('symbol=')
        ? new Set(['@owp/core:known', '@owp/components:reference'])
        : undefined,
    );
    expect(metadata.sampleIds).toEqual(
      selection.includes('sample=') ? new Set(['settings']) : undefined,
    );
  });

  it('shares a pending resource between prefetch and concurrent clicks', async () => {
    // Given
    const fetchMetadata = vi.fn(async () => Response.json(catalog));
    const load = createNavigationMetadataLoader(fetchMetadata);
    const selected = { ...request, currentHref: `${request.currentHref}&sample=settings` };
    // When
    await Promise.all([load(selected), load(selected), load(selected)]);
    // Then
    expect(fetchMetadata).toHaveBeenCalledTimes(1);
  });

  it('reuses successful resources when the selection later needs both metadata types', async () => {
    // Given
    const fetchMetadata = vi.fn(async (path: string) =>
      Response.json(path.includes('/api/') ? api : catalog),
    );
    const load = createNavigationMetadataLoader(fetchMetadata);
    await load({ ...request, currentHref: `${request.currentHref}&sample=settings` });
    // When
    await load({
      ...request,
      currentHref: `${request.currentHref}&sample=settings&symbol=missing`,
    });
    // Then
    expect(fetchMetadata.mock.calls.map(([path]) => path)).toEqual([
      '/versions/target/catalogs/core.sources.json',
      '/versions/target/api/core.json',
    ]);
  });

  it.each(['network', 'http', 'schema', 'identity'] as const)(
    'evicts a failed %s resource so a later click can retry',
    async (failure) => {
      // Given
      const fetchMetadata = vi.fn(async () => Response.json(catalog));
      if (failure === 'network') fetchMetadata.mockRejectedValueOnce(new TypeError('offline'));
      if (failure === 'http')
        fetchMetadata.mockResolvedValueOnce(new Response(null, { status: 503 }));
      if (failure === 'schema') fetchMetadata.mockResolvedValueOnce(Response.json({}));
      if (failure === 'identity')
        fetchMetadata.mockResolvedValueOnce(Response.json({ ...catalog, packageVersion: '9.0.0' }));
      const load = createNavigationMetadataLoader(fetchMetadata);
      const selected = { ...request, currentHref: `${request.currentHref}&sample=settings` };
      await expect(load(selected)).rejects.toBeInstanceOf(Error);
      // When
      const retried = await load(selected);
      // Then
      expect(fetchMetadata).toHaveBeenCalledTimes(2);
      expect(retried.sampleIds).toEqual(new Set(['settings']));
    },
  );

  it.each([
    { ...catalog, package: '@owp/datagrid' },
    { ...catalog, packageVersion: '9.0.0' },
    { samples: catalog.samples },
  ])('rejects an unverified catalog identity: %j', async (payload) => {
    // Given
    const load = createNavigationMetadataLoader(async () => Response.json(payload));
    // When
    const result = load({ ...request, currentHref: `${request.currentHref}&sample=settings` });
    // Then
    await expect(result).rejects.toBeInstanceOf(Error);
  });

  it.each([
    { ...api, id: 'datagrid', name: '@owp/datagrid' },
    { ...api, version: '9.0.0' },
    { ...api, records: [{ id: 'incomplete' }] },
  ])('keeps full API schema and package validation: %j', async (payload) => {
    // Given
    const load = createNavigationMetadataLoader(async () => Response.json(payload));
    // When
    const result = load({ ...request, currentHref: `${request.currentHref}&symbol=missing` });
    // Then
    await expect(result).rejects.toBeInstanceOf(Error);
  });

  it.each(['release', 'manifest', 'package', 'version'] as const)(
    'isolates cached resources by %s',
    async (dimension) => {
      // Given
      const fetchMetadata = vi.fn(async () => Response.json(catalog));
      const load = createNavigationMetadataLoader(fetchMetadata);
      const selected = { ...request, currentHref: `${request.currentHref}&sample=settings` };
      await load(selected);
      const otherRelease = releaseIndexEntrySchema.parse({
        ...release,
        ...(dimension === 'release' ? { releaseId: 'other', basePath: '/versions/other/' } : {}),
        ...(dimension === 'manifest' ? { manifestSha256: '1'.repeat(64) } : {}),
        ...(dimension === 'version'
          ? { packages: [{ id: 'core', name: '@owp/core', version: '10.1.0' }] }
          : {}),
      });
      const otherPackage = dimension === 'package' ? 'datagrid' : 'core';
      const expectedPackage = otherRelease.packages.find((entry) => entry.id === otherPackage);
      fetchMetadata.mockResolvedValueOnce(
        Response.json({
          ...catalog,
          package: expectedPackage?.name,
          packageVersion: expectedPackage?.version,
        }),
      );
      // When
      await load({ ...selected, release: otherRelease, packageId: otherPackage });
      // Then
      expect(fetchMetadata).toHaveBeenCalledTimes(2);
    },
  );

  it('keeps metadata requests under the ten-second timeout', async () => {
    // Given
    const signals: AbortSignal[] = [];
    const load = createNavigationMetadataLoader(async (_path, { signal }) => {
      signals.push(signal);
      return Response.json(catalog);
    });
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    // When
    await load({ ...request, currentHref: `${request.currentHref}&sample=settings` });
    // Then
    expect(timeout).toHaveBeenCalledWith(10_000);
    expect(signals[0]?.aborted).toBe(false);
    timeout.mockRestore();
  });

  it('preserves an available sample and removes unavailable selections after targeted loading', async () => {
    // Given
    const currentHref = `${request.currentHref}&sample=settings&symbol=removed&lang=en&colorMode=dark`;
    const load = createNavigationMetadataLoader(async (path) =>
      Response.json(path.includes('/api/') ? api : catalog),
    );
    const metadata = await load({ ...request, currentHref });
    // When
    const url = createVersionUrl({
      currentHref,
      release,
      packageId: 'core',
      language: 'en',
      colorMode: 'dark',
      ...metadata,
    });
    // Then
    expect(url.pathname).toBe(release.basePath);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      package: 'core',
      sample: 'settings',
      lang: 'en',
      colorMode: 'dark',
    });
  });

  it.each(['@owp/core:known', '@owp/components:reference'])(
    'preserves an available primary or reference API symbol: %s',
    async (symbol) => {
      // Given
      const currentHref = `${request.currentHref}&view=api&symbol=${encodeURIComponent(symbol)}`;
      const load = createNavigationMetadataLoader(async () => Response.json(api));
      const metadata = await load({ ...request, currentHref });
      // When
      const url = createVersionUrl({
        currentHref,
        release,
        packageId: 'core',
        language: 'ko',
        colorMode: 'light',
        ...metadata,
      });
      // Then
      expect(url.searchParams.get('symbol')).toBe(symbol);
    },
  );
});
