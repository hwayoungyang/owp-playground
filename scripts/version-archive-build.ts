import { z } from 'zod';
import { packageKnowledgeSchema } from '../src/features/api/model/schema.ts';
import {
  exactPackageVersionSchema, releasePackageIdSchema, releasePackageSchema, type ReleasePackage,
} from '../src/features/releases/model/schema.ts';
import {
  collectArchiveFiles, parseArchiveData, parseArchiveJson, readArchiveBytes,
  safeArchivePath, VersionArchiveError,
} from './version-archive-files.ts';

export const archivedPackageKnowledgeSchema = packageKnowledgeSchema.safeExtend({ id: releasePackageIdSchema });
export type ArchivedPackageKnowledge = z.infer<typeof archivedPackageKnowledgeSchema>;
const packageIdentitySchema = z.object({ id: releasePackageIdSchema, name: z.string(), version: exactPackageVersionSchema });
const catalogSchema = z.object({
  version: z.literal(1),
  packages: z.array(z.discriminatedUnion('status', [
    packageIdentitySchema.extend({ status: z.literal('ready') }),
    z.object({ id: releasePackageIdSchema, name: z.string(), version: z.null(), status: z.literal('planned') }),
  ])).min(1),
});
const knowledgeIndexSchema = z.object({
  schemaVersion: z.literal(1), packages: z.array(packageIdentitySchema).min(1),
  resources: z.array(z.string()).min(1),
  records: z.array(z.object({ id: z.string(), packageVersion: exactPackageVersionSchema })).min(1),
});
const sourceFileSchema = z.object({
  path: z.string(), sha256: z.string().regex(/^[0-9a-f]{64}$/), dependencies: z.array(z.string()),
});
const sourceCatalogSchema = z.object({
  version: z.literal(1), package: z.string(), packageVersion: exactPackageVersionSchema,
  samples: z.array(z.object({ id: z.string(), entrypoint: z.string(), files: z.array(sourceFileSchema).min(1) })).min(1),
});

export function archiveResourcePath(reference: string, basePath: string): string {
  const raw = reference.split(/[?#]/)[0] ?? '';
  let decoded: string;
  try { decoded = decodeURIComponent(raw); }
  catch (error) {
    if (error instanceof URIError) throw new VersionArchiveError('UNSAFE_PATH', `URL 인코딩이 올바르지 않습니다: ${reference}`, { cause: error });
    throw error;
  }
  if (decoded.split('/').some((segment) => segment === '.' || segment === '..') || decoded.includes('\\')) {
    throw new VersionArchiveError('UNSAFE_PATH', `안전하지 않은 자산 URL입니다: ${reference}`);
  }
  const url = new URL(reference, `https://archive.invalid${basePath}`);
  if (url.origin !== 'https://archive.invalid' || !url.pathname.startsWith(basePath)) {
    throw new VersionArchiveError('UNSAFE_PATH', `릴리스 basePath 밖의 자산 URL입니다: ${reference}`);
  }
  return decodeURIComponent(url.pathname.slice(basePath.length)) || 'index.html';
}

function sourceFilePath(reference: string, basePath: string): string {
  return reference.startsWith('/snippets/') ? reference.slice(1) : archiveResourcePath(reference, basePath);
}

export async function validateArchivedBuild(directory: string, basePath: string): Promise<readonly ReleasePackage[]> {
  const files = await collectArchiveFiles(directory);
  for (const required of ['index.html', 'robots.txt', 'packages.json', 'knowledge/index.json', 'knowledge/records.jsonl', 'knowledge/example-links.json']) {
    if (!(files[required]?.bytes)) throw new VersionArchiveError('INVALID_DATA', `빌드 필수 파일이 없거나 비어 있습니다: ${required}`);
  }
  for (const extension of ['.js', '.css']) {
    if (!Object.entries(files).some(([file, entry]) => file.startsWith('assets/') && file.endsWith(extension) && entry.bytes > 0)) {
      throw new VersionArchiveError('INVALID_DATA', `빌드 assets에 ${extension} 파일이 없습니다.`);
    }
  }
  const html = (await readArchiveBytes(directory, 'index.html')).toString('utf8');
  for (const match of html.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    const reference = match[1];
    if (!reference || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) continue;
    if (!(files[archiveResourcePath(reference, basePath)]?.bytes)) {
      throw new VersionArchiveError('INVALID_DATA', `index.html이 참조하는 자산이 없습니다: ${reference}`);
    }
  }
  const catalog = parseArchiveJson(catalogSchema, await readArchiveBytes(directory, 'packages.json'), 'packages.json');
  const knowledge = parseArchiveJson(knowledgeIndexSchema, await readArchiveBytes(directory, 'knowledge/index.json'), 'knowledge/index.json');
  const ready = catalog.packages.flatMap((entry) => entry.status === 'ready'
    ? [parseArchiveData(releasePackageSchema, { id: entry.id, name: entry.name, version: entry.version }, entry.id)] : []);
  const published = knowledge.packages.map((entry) => parseArchiveData(releasePackageSchema, entry, entry.id));
  if (ready.length === 0 || new Set(catalog.packages.map((entry) => entry.id)).size !== catalog.packages.length ||
      ready.length !== published.length || ready.some((entry) => !published.some((candidate) => JSON.stringify(candidate) === JSON.stringify(entry)))) {
    throw new VersionArchiveError('INVALID_DATA', 'ready 패키지 목록과 knowledge 패키지 목록이 다릅니다.');
  }
  for (const reference of knowledge.resources) {
    if (!(files[archiveResourcePath(reference, basePath)]?.bytes)) throw new VersionArchiveError('INVALID_DATA', `knowledge 자산이 없습니다: ${reference}`);
  }
  for (const entry of ready) {
    for (const required of [`api/${entry.id}.json`, `catalogs/${entry.id}.sources.json`]) {
      if (!(files[required]?.bytes)) throw new VersionArchiveError('INVALID_DATA', `패키지 자산이 없습니다: ${required}`);
    }
    const dataset = parseArchiveJson(archivedPackageKnowledgeSchema, await readArchiveBytes(directory, `api/${entry.id}.json`), entry.id);
    if (dataset.id !== entry.id || dataset.name !== entry.name || dataset.version !== entry.version || dataset.records.length === 0) {
      throw new VersionArchiveError('INVALID_DATA', `API dataset의 패키지 정보가 다릅니다: ${entry.id}`);
    }
    const sourceCatalog = parseArchiveJson(sourceCatalogSchema,
      await readArchiveBytes(directory, `catalogs/${entry.id}.sources.json`), `${entry.id} source catalog`);
    if (sourceCatalog.package !== entry.name || sourceCatalog.packageVersion !== entry.version) {
      throw new VersionArchiveError('INVALID_DATA', `소스 catalog의 패키지 정보가 다릅니다: ${entry.id}`);
    }
    for (const sample of sourceCatalog.samples) {
      const paths = new Set(sample.files.map((file) => file.path));
      if (!paths.has(sample.entrypoint)) throw new VersionArchiveError('INVALID_DATA', `예제 entrypoint가 없습니다: ${entry.id}/${sample.id}`);
      for (const file of sample.files) {
        const relative = sourceFilePath(file.path, basePath);
        safeArchivePath(directory, relative);
        if (files[relative]?.sha256 !== file.sha256 || file.dependencies.some((dependency) => !paths.has(dependency))) {
          throw new VersionArchiveError('INTEGRITY_MISMATCH', `예제 소스 또는 의존성이 다릅니다: ${file.path}`);
        }
      }
    }
    for (const record of [...dataset.records, ...dataset.referenceRecords]) {
      const indexed = knowledge.records.find((candidate) => candidate.id === record.id);
      if (!indexed || indexed.packageVersion !== record.packageVersion || (record.package === entry.name && record.packageVersion !== entry.version)) {
        throw new VersionArchiveError('INVALID_DATA', `knowledge index의 API 정보가 다릅니다: ${record.id}`);
      }
      archiveResourcePath(record.url, basePath);
      if (record.kind === 'guide' && record.package === entry.name) {
        const guidePath = `knowledge/guides/${entry.id}/${record.path.replace(/^guide\./, '')}.md`;
        safeArchivePath(directory, guidePath);
        if (!(files[guidePath]?.bytes)) throw new VersionArchiveError('INVALID_DATA', `가이드 원문이 없습니다: ${guidePath}`);
      }
      for (const example of record.examples) {
        archiveResourcePath(example.url, basePath);
        archiveResourcePath(example.codeUrl, basePath);
        const relative = sourceFilePath(example.entrypoint, basePath);
        if (files[relative]?.sha256 !== example.sha256) throw new VersionArchiveError('INTEGRITY_MISMATCH', `API 예제 소스가 다릅니다: ${example.entrypoint}`);
      }
    }
  }
  return ready;
}
