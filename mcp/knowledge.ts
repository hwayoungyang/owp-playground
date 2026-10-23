import { z } from 'zod';
import type { ApiRecord } from '../src/features/api/model/schema.ts';
import { matchesApiQueryWords, normalizeApiQuery } from '../src/features/api/model/search.ts';
import { readArchivedFile } from '../scripts/version-archive.ts';
import { apiInput, guideInput, listInput, searchInput } from './schema.ts';
import {
  createKnowledgeArchive,
  KnowledgeError,
  type KnowledgeOptions,
} from './knowledge-archive.ts';
import { getArchivedExample } from './knowledge-example.ts';
export { KnowledgeError, type KnowledgeOptions } from './knowledge-archive.ts';

export function createKnowledgeStore(options: KnowledgeOptions) {
  const archive = createKnowledgeArchive(options);
  const { sourceUrl, eligible, archivedRelease, resolve, metadata, dataset, sources } = archive;
  const summary = (record: ApiRecord, releaseId: string) => ({
    id: record.id,
    kind: record.kind === 'guide' ? 'guide' : 'api',
    name: record.name,
    description: record.description.slice(0, 600),
    url: sourceUrl(releaseId, record.url),
  });
  return {
    sourceUrl,
    async resourceLinks() {
      const { entry } = await resolve({});
      const links = [];
      for (const pkg of entry.packages) {
        const { dataset: data } = await dataset({ package: pkg.id, releaseId: entry.releaseId });
        const release = await archivedRelease(entry);
        const manifest = await sources(release, pkg.id);
        const records = [
          ...data.records.filter((record) => record.kind !== 'guide').slice(0, 10),
          ...data.records.filter((record) => record.kind === 'guide').slice(0, 20),
        ];
        links.push(
          ...records.map((record) => ({
            uri: `owp://${entry.releaseId}/${pkg.id}/${record.kind === 'guide' ? 'guide' : 'api'}/${encodeURIComponent(record.id)}`,
            name: `${pkg.name} ${record.name}`,
            mimeType: 'application/json',
          })),
          ...manifest.samples.slice(0, 20).map((sample) => ({
            uri: `owp://${entry.releaseId}/${pkg.id}/source/${encodeURIComponent(sample.id)}`,
            name: `${pkg.name} ${sample.title}`,
            mimeType: 'application/json',
          })),
        );
      }
      return links;
    },
    async listPackages(raw: unknown) {
      const input = listInput.parse(raw);
      const { entry } = await resolve(input);
      const { releases } = await eligible();
      return {
        ...metadata(entry.releaseId, null, null, ['/knowledge/index.json']),
        packages: entry.packages.map((item) => ({
          ...item,
          availableVersions: [
            ...new Set(
              releases.flatMap((release) =>
                release.packages.filter((pkg) => pkg.id === item.id).map((pkg) => pkg.version),
              ),
            ),
          ],
        })),
      };
    },
    async searchKnowledge(raw: unknown) {
      const input = searchInput.parse(raw);
      const { entry, release, dataset: data, packageId, meta } = await dataset(input);
      const words = normalizeApiQuery(input.query);
      const records = data.records
        .filter(
          (record) =>
            (input.kind === 'all' ||
              (input.kind === 'guide'
                ? record.kind === 'guide'
                : input.kind === 'api' && record.kind !== 'guide')) &&
            matchesApiQueryWords(record, words),
        )
        .map((record) => summary(record, entry.releaseId));
      if (input.kind === 'all' || input.kind === 'example') {
        const manifest = await sources(release, packageId ?? '');
        records.push(
          ...manifest.samples
            .filter((sample) => {
              const text =
                `${sample.id} ${sample.title} ${sample.description} ${sample.api.join(' ')}`.toLocaleLowerCase();
              return words.every((word) => text.includes(word));
            })
            .map((sample) => ({
              id: sample.id,
              kind: 'example',
              name: sample.title,
              description: sample.description.slice(0, 600),
              url: sourceUrl(
                entry.releaseId,
                `/?${new URLSearchParams({ package: packageId ?? '', sample: sample.id })}`,
              ),
            })),
        );
      }
      return {
        ...meta,
        results: records.slice(input.offset, input.offset + input.limit),
        total: records.length,
        nextOffset: input.offset + input.limit < records.length ? input.offset + input.limit : null,
      };
    },
    async getApi(raw: unknown) {
      const input = apiInput.parse(raw);
      const { entry, dataset: data, meta } = await dataset(input);
      const all = [...data.records, ...data.referenceRecords];
      const matches = all.filter(
        (record) =>
          record.kind !== 'guide' &&
          (record.id === input.symbol ||
            record.id === `${data.name}:${input.symbol}` ||
            record.name === input.symbol),
      );
      const record =
        matches.find(
          (record) => record.id === input.symbol || record.id === `${data.name}:${input.symbol}`,
        ) ?? (matches.length === 1 ? matches[0] : undefined);
      if (!record)
        throw new KnowledgeError(
          matches.length > 1 ? 'AMBIGUOUS_SYMBOL' : 'API_NOT_FOUND',
          '정확한 API ID 또는 고유한 이름을 지정해야 합니다.',
        );
      const members = all.filter(
        (item) =>
          item.id !== record.id &&
          item.package === record.package &&
          item.owner === record.owner &&
          item.path.startsWith(record.path ? `${record.path}.` : ''),
      );
      return {
        ...meta,
        record: {
          ...record,
          url: sourceUrl(entry.releaseId, record.url),
          examples: record.examples.map((example) => ({
            ...example,
            url: sourceUrl(entry.releaseId, example.url),
            codeUrl: sourceUrl(entry.releaseId, example.codeUrl),
            entrypoint: sourceUrl(entry.releaseId, example.entrypoint),
          })),
        },
        members: members
          .slice(input.offset, input.offset + input.limit)
          .map((item) => summary(item, entry.releaseId)),
        total: members.length,
        nextOffset: input.offset + input.limit < members.length ? input.offset + input.limit : null,
      };
    },
    async getExample(raw: unknown) {
      return getArchivedExample(archive, raw);
    },
    async getGuide(raw: unknown) {
      const input = guideInput.parse(raw);
      const { entry, dataset: data, meta } = await dataset(input);
      const id =
        input.guideId === 'setup'
          ? data.id === 'datagrid'
            ? 'connection'
            : data.id === 'charts'
              ? 'composition'
              : 'setup'
          : input.guideId;
      const record = data.records.find(
        (record) =>
          record.kind === 'guide' &&
          (record.id === id || record.id === `${data.name}:guide.${id}` || record.path === id),
      );
      if (!record)
        throw new KnowledgeError('GUIDE_NOT_FOUND', '등록된 가이드 ID를 지정해야 합니다.');
      return {
        ...meta,
        id: record.id,
        title: record.name,
        description: record.description,
        content: record.body.slice(input.offset, input.offset + input.maxChars),
        contentHash: record.contentHash,
        url: sourceUrl(entry.releaseId, record.url),
        totalChars: record.body.length,
        nextOffset:
          input.offset + input.maxChars < record.body.length ? input.offset + input.maxChars : null,
      };
    },
    async readStatic(releaseId: string, file: string) {
      const { release } = await resolve({ releaseId });
      return readArchivedFile(release, file);
    },
    async latestReleaseId() {
      return (await resolve({})).entry.releaseId;
    },
    async versionIndex() {
      const { index, releases } = await eligible();
      const latestReleaseId = releases.some((entry) => entry.releaseId === index.latestReleaseId)
        ? index.latestReleaseId
        : releases.at(-1)?.releaseId;
      if (!latestReleaseId)
        throw new KnowledgeError('RELEASE_NOT_FOUND', '공개 가능한 release가 없습니다.');
      return { ...index, latestReleaseId, releases };
    },
  };
}

export type KnowledgeStore = ReturnType<typeof createKnowledgeStore>;
export const resourceRequestSchema = z.object({
  package: z.string(),
  releaseId: z.string(),
  kind: z.enum(['api', 'guide', 'source']),
  key: z.string(),
});
