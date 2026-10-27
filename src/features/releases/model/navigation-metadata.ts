import { z } from 'zod';
import { packageKnowledgeSchema } from '../../api/model/schema';
import type { ReleaseIndexEntry } from './schema';

const sourceCatalogSchema = z.object({
  package: z.string(),
  packageVersion: z.string(),
  samples: z.array(z.object({ id: z.string() })),
});

type MetadataRequest = {
  readonly release: ReleaseIndexEntry;
  readonly packageId: string;
  readonly currentHref: string;
};

type NavigationMetadata = {
  readonly apiIds: ReadonlySet<string> | undefined;
  readonly sampleIds: ReadonlySet<string> | undefined;
};

type MetadataFetch = (url: string, options: { readonly signal: AbortSignal }) => Promise<Response>;

export function createNavigationMetadataLoader(fetchMetadata: MetadataFetch = fetch) {
  const cache = new Map<string, Promise<ReadonlySet<string>>>();

  const loadResource = (
    { release, packageId }: MetadataRequest,
    resource: 'api' | 'catalog',
  ): Promise<ReadonlySet<string>> => {
    const expected = release.packages.find((entry) => entry.id === packageId);
    if (!expected) return Promise.reject(new TypeError('Version package missing'));
    const key = JSON.stringify([
      release.releaseId,
      release.manifestSha256,
      packageId,
      expected.version,
      resource,
    ]);
    const cached = cache.get(key);
    if (cached) return cached;
    const pending = (async () => {
      const path =
        resource === 'api' ? `api/${packageId}.json` : `catalogs/${packageId}.sources.json`;
      const response = await fetchMetadata(`${release.basePath}${path}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new TypeError('Version data HTTP failure');
      const payload: unknown = await response.json();
      if (resource === 'api') {
        const api = packageKnowledgeSchema.parse(payload);
        if (api.id !== packageId || api.version !== expected.version)
          throw new TypeError('Version API package mismatch');
        return new Set([...api.records, ...api.referenceRecords].map((record) => record.id));
      }
      const catalog = sourceCatalogSchema.parse(payload);
      if (catalog.package !== expected.name || catalog.packageVersion !== expected.version)
        throw new TypeError('Version catalog package mismatch');
      return new Set(catalog.samples.map((sample) => sample.id));
    })().catch((error: unknown) => {
      cache.delete(key);
      throw error;
    });
    cache.set(key, pending);
    return pending;
  };

  return async (request: MetadataRequest): Promise<NavigationMetadata> => {
    const selection = new URL(request.currentHref).searchParams;
    const [apiIds, sampleIds] = await Promise.all([
      selection.get('symbol') ? loadResource(request, 'api') : undefined,
      selection.get('sample') ? loadResource(request, 'catalog') : undefined,
    ]);
    return { apiIds, sampleIds };
  };
}

export const loadNavigationMetadata = createNavigationMetadataLoader();
