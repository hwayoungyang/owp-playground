import { z } from 'zod';
import { completedPlaygroundPackages } from '../../../playgrounds/packages';
import { apiExampleKey } from './package-data.ts';
import { compareApiMembers } from './presentation.ts';
import {
  apiPackageIdSchema,
  packageKnowledgeSchema,
  type ApiExampleSummary,
  type ApiPackageId,
  type ApiRecord,
  type PackageKnowledge,
} from './schema.ts';

export type { ApiRecord, ApiPackageId, PackageKnowledge } from './schema.ts';

export type ApiDataset = {
  readonly knowledge: PackageKnowledge;
  readonly records: readonly ApiRecord[];
  readonly recordsById: ReadonlyMap<string, ApiRecord>;
  readonly membersByOwner: ReadonlyMap<string, readonly ApiRecord[]>;
  readonly examplesByKey: ReadonlyMap<string, ApiExampleSummary>;
};

export function createApiDataset(knowledge: PackageKnowledge): ApiDataset {
  const recordsById = new Map(
    [...knowledge.records, ...knowledge.referenceRecords].map((record) => [record.id, record]),
  );
  const membersByOwner = new Map<string, ApiRecord[]>();
  for (const record of recordsById.values()) {
    if (!record.path || record.path.includes('.') || record.kind === 'guide') continue;
    const key = `${record.package}:${record.owner}`;
    const members = membersByOwner.get(key) ?? [];
    members.push(record);
    membersByOwner.set(key, members);
  }
  for (const members of membersByOwner.values()) members.sort(compareApiMembers);
  const main = knowledge.id === 'datagrid' ? 'OwpDataGridProps' : 'ChartFrameProps';
  const order = [main, 'OwpDataGridColumn', 'OwpDataGridApi', 'Guides'];
  const rank = (owner: string) => {
    const index = order.indexOf(owner);
    return index < 0 ? order.length : index;
  };
  const records = [...knowledge.records].sort(
    (left, right) =>
      rank(left.owner) - rank(right.owner) ||
      Number(Boolean(left.path)) - Number(Boolean(right.path)) ||
      left.id.localeCompare(right.id),
  );
  return {
    knowledge,
    records,
    recordsById,
    membersByOwner,
    examplesByKey: new Map(knowledge.examples.map((example) => [apiExampleKey(example), example])),
  };
}

type ApiKnowledgeFailure = 'package' | 'http' | 'timeout' | 'network' | 'json' | 'schema';

export class ApiKnowledgeLoadError extends Error {
  readonly name = 'ApiKnowledgeLoadError';
  readonly packageId: string;
  readonly reason: ApiKnowledgeFailure;
  readonly status: number | undefined;

  constructor(
    packageId: string,
    reason: ApiKnowledgeFailure,
    options?: ErrorOptions,
    status?: number,
  ) {
    super(`API data load failed: ${packageId}/${reason}`, options);
    this.packageId = packageId;
    this.reason = reason;
    this.status = status;
  }
}

async function fetchPackageKnowledge(
  packageId: ApiPackageId,
  fetchResource: typeof fetch,
): Promise<ApiDataset> {
  const signal = AbortSignal.timeout(30_000);
  try {
    const response = await fetchResource(`${import.meta.env.BASE_URL}api/${packageId}.json`, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok)
      throw new ApiKnowledgeLoadError(packageId, 'http', undefined, response.status);
    const payload: unknown = await response.json();
    const knowledge = packageKnowledgeSchema.parse(payload);
    if (knowledge.id !== packageId) throw new ApiKnowledgeLoadError(packageId, 'schema');
    return createApiDataset(knowledge);
  } catch (error) {
    if (error instanceof ApiKnowledgeLoadError) throw error;
    if (error instanceof z.ZodError)
      throw new ApiKnowledgeLoadError(packageId, 'schema', { cause: error });
    if (error instanceof SyntaxError)
      throw new ApiKnowledgeLoadError(packageId, 'json', { cause: error });
    if (
      signal.aborted &&
      signal.reason instanceof DOMException &&
      signal.reason.name === 'TimeoutError'
    ) {
      throw new ApiKnowledgeLoadError(packageId, 'timeout', { cause: error });
    }
    if (error instanceof Error)
      throw new ApiKnowledgeLoadError(packageId, 'network', { cause: error });
    throw error;
  }
}

export function createApiKnowledgeLoader(fetchResource: typeof fetch = fetch) {
  // 지원하는 두 package만 보관하며, 화면의 dataset은 context로 전달합니다.
  const datasets = new Map<ApiPackageId, ApiDataset>();
  const requests = new Map<ApiPackageId, Promise<ApiDataset>>();
  return (value: string): Promise<ApiDataset> => {
    const parsed = apiPackageIdSchema.safeParse(value);
    if (!parsed.success || !completedPlaygroundPackages.some((entry) => entry.id === parsed.data))
      return Promise.reject(new ApiKnowledgeLoadError(value, 'package'));
    const packageId = parsed.data;
    const cached = datasets.get(packageId);
    if (cached) return Promise.resolve(cached);
    const pending = requests.get(packageId);
    if (pending) return pending;
    const request = fetchPackageKnowledge(packageId, fetchResource).then(
      (dataset) => {
        datasets.set(packageId, dataset);
        requests.delete(packageId);
        return dataset;
      },
      (error: unknown) => {
        requests.delete(packageId);
        throw error;
      },
    );
    requests.set(packageId, request);
    return request;
  };
}

export const loadPackageKnowledge = createApiKnowledgeLoader();
