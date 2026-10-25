import type { ApiExampleSummary } from './schema.ts';
import { referencePackagesFor } from '../../../playgrounds/packages.ts';

type ReferenceRecord = {
  readonly id: string;
  readonly package: string;
  readonly owner: string;
  readonly path: string;
  readonly kind: string;
  readonly related: readonly string[];
  readonly guideIds?: readonly string[];
  readonly typeReferences?: Readonly<Record<string, string>>;
  readonly typeDetails?: { readonly sources: readonly string[] };
  readonly declaredIn?: string;
  readonly inheritedFrom?: readonly string[];
  readonly examples: readonly { readonly packageId: string; readonly id: string }[];
};

export function apiRecordReferenceIds(record: ReferenceRecord): readonly string[] {
  return [
    ...new Set([
      ...record.related,
      ...(record.guideIds ?? []),
      ...Object.values(record.typeReferences ?? {}),
      ...(record.typeDetails?.sources ?? []),
      ...(record.inheritedFrom ?? []),
      ...(record.declaredIn ? [record.declaredIn] : []),
      ...(record.path && record.kind !== 'guide' ? [`${record.package}:${record.owner}`] : []),
    ]),
  ];
}

export function apiExampleKey(example: {
  readonly packageId: string;
  readonly id: string;
}): string {
  return `${example.packageId}/${example.id}`;
}

export class ApiKnowledgeReferenceError extends Error {
  readonly name = 'ApiKnowledgeReferenceError';
  readonly recordId: string;
  readonly referenceId: string;

  constructor(recordId: string, referenceId: string) {
    super(`API 참조가 없습니다: ${recordId}/${referenceId}`);
    this.recordId = recordId;
    this.referenceId = referenceId;
  }
}

export function createPackageKnowledge<T extends ReferenceRecord>(
  data: {
    readonly dependencies: Readonly<Record<string, string>>;
    readonly records: readonly T[];
    readonly examples: readonly ApiExampleSummary[];
  },
  entry: { readonly id: string; readonly name: string; readonly version: string },
) {
  const records = data.records.filter(
    (record) =>
      record.package === entry.name ||
      (referencePackagesFor(entry.id).includes(record.package) &&
        Object.hasOwn(data.dependencies, record.package)),
  );
  const allRecords = new Map(data.records.map((record) => [record.id, record]));
  const membersByOwner = new Map<string, T[]>();
  for (const record of data.records) {
    if (!record.path || record.kind === 'guide') continue;
    const ownerId = `${record.package}:${record.owner}`;
    const members = membersByOwner.get(ownerId) ?? [];
    members.push(record);
    membersByOwner.set(ownerId, members);
  }
  const included = new Set(records.map((record) => record.id));
  const referenceRecords: T[] = [];
  const pending = [...records];
  for (const record of pending) {
    const memberIds =
      !record.path && record.kind !== 'guide' && record.package !== entry.name
        ? (membersByOwner.get(`${record.package}:${record.owner}`) ?? []).map((member) => member.id)
        : [];
    for (const id of [...apiRecordReferenceIds(record), ...memberIds]) {
      const target = allRecords.get(id);
      if (!target) throw new ApiKnowledgeReferenceError(record.id, id);
      if (included.has(id)) continue;
      included.add(id);
      referenceRecords.push(target);
      pending.push(target);
    }
  }
  const exampleKeys = new Set(pending.flatMap((record) => record.examples.map(apiExampleKey)));
  const examples = data.examples
    .filter((example) => exampleKeys.has(apiExampleKey(example)))
    .map(({ packageId, id, title, source }) => ({ packageId, id, title, source }));
  const summaries = new Set(examples.map(apiExampleKey));
  for (const key of exampleKeys) {
    if (!summaries.has(key)) throw new ApiKnowledgeReferenceError(entry.name, key);
  }
  return {
    schemaVersion: 1,
    ...entry,
    dependencies: data.dependencies,
    records,
    referenceRecords,
    examples,
  };
}
