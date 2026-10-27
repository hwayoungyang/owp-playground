import { createHash } from 'node:crypto';
import { completedPlaygroundPackages } from '../src/playgrounds/packages.ts';
import type { ReleaseIndex, ReleaseIndexEntry } from '../src/features/releases/model/schema.ts';
import { archivedPackageKnowledgeSchema } from '../scripts/version-archive-build.ts';
import { filesystemErrorCode, readArchiveBytes } from '../scripts/version-archive-files.ts';
import {
  readArchivedFile,
  readArchivedRelease,
  readVersionArchive,
  type ArchivedRelease,
} from '../scripts/version-archive.ts';
import { sourceManifestSchema } from './schema.ts';

export class KnowledgeError extends Error {
  readonly code: string;
  readonly availableVersions: readonly string[];
  constructor(code: string, message: string, availableVersions: readonly string[] = []) {
    super(message);
    this.name = 'KnowledgeError';
    this.code = code;
    this.availableVersions = availableVersions;
  }
}

export type KnowledgeOptions = {
  readonly archiveRoot: string;
  readonly allowDrafts?: boolean;
  readonly publicUrl?: string;
};

export function createKnowledgeArchive(options: KnowledgeOptions) {
  // index가 바뀔 때 전체 archive를 재검증하고, 파일 조회는 각 manifest hash를 검증합니다.
  let snapshot: { readonly sha256: string; readonly index: ReleaseIndex } | undefined;
  const verifiedReleases = new Map<string, ArchivedRelease>();
  const publicUrl = options.publicUrl ? new URL(options.publicUrl) : undefined;
  if (
    publicUrl &&
    (!['http:', 'https:'].includes(publicUrl.protocol) ||
      publicUrl.username ||
      publicUrl.password ||
      publicUrl.search ||
      publicUrl.hash)
  ) {
    throw new KnowledgeError(
      'INVALID_PUBLIC_URL',
      'public URL은 인증 정보가 없는 HTTP(S) URL이어야 합니다.',
    );
  }
  const sourceUrl = (releaseId: string, file: string) => {
    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(file.split(/[?#]/)[0] ?? '');
    } catch (error) {
      if (!(error instanceof URIError)) throw error;
      throw new KnowledgeError('UNSAFE_PATH', 'URL 인코딩이 올바르지 않습니다.');
    }
    if (
      !file.startsWith('/') ||
      decodedPath.startsWith('//') ||
      decodedPath.includes('\\') ||
      decodedPath.includes('\0') ||
      decodedPath.split('/').some((part) => part === '.' || part === '..')
    ) {
      throw new KnowledgeError('UNSAFE_PATH', '상대 archive URL만 사용할 수 있습니다.');
    }
    const basePath = `/versions/${releaseId}/`;
    if (file.startsWith('/versions/') && !file.startsWith(basePath)) {
      throw new KnowledgeError('UNSAFE_PATH', '다른 release의 URL은 조회할 수 없습니다.');
    }
    const result = file.startsWith(basePath) ? file : `${basePath}${file.slice(1)}`;
    return publicUrl ? new URL(result, publicUrl).href : result;
  };
  const eligible = async () => {
    let bytes: Buffer;
    try {
      bytes = await readArchiveBytes(options.archiveRoot, 'versions/index.json');
    } catch (error) {
      if (filesystemErrorCode(error) !== 'ENOENT') throw error;
      throw new KnowledgeError(
        'ARCHIVE_NOT_FOUND',
        '버전 archive가 없습니다. 먼저 pnpm snapshot:create로 Playground snapshot을 생성하세요.',
      );
    }
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (snapshot?.sha256 !== sha256)
      snapshot = { sha256, index: await readVersionArchive(options.archiveRoot) };
    const index = snapshot.index;
    const releases = index.releases
      .filter((entry) => options.allowDrafts || entry.channel === 'stable')
      .map((entry) => ({
        ...entry,
        packages: entry.packages.filter((pkg) =>
          completedPlaygroundPackages.some((ready) => ready.id === pkg.id),
        ),
      }));
    return { index, releases };
  };
  async function archivedRelease(entry: ReleaseIndexEntry) {
    const key = `${entry.releaseId}:${entry.manifestSha256}`;
    let release = verifiedReleases.get(key);
    if (!release) {
      release = await readArchivedRelease(options.archiveRoot, entry.releaseId);
      verifiedReleases.set(key, release);
    }
    return release;
  }
  async function resolve(input: {
    readonly package?: string;
    readonly version?: string;
    readonly releaseId?: string;
  }) {
    const { index, releases } = await eligible();
    const packageId = input.package?.replace(/^@owp\//, '');
    const availableVersions = [
      ...new Set(
        releases.flatMap((release) =>
          release.packages.filter((entry) => entry.id === packageId).map((entry) => entry.version),
        ),
      ),
    ];
    const explicit = input.releaseId
      ? releases.find((entry) => entry.releaseId === input.releaseId)
      : undefined;
    if (input.releaseId && !explicit)
      throw new KnowledgeError(
        'RELEASE_NOT_FOUND',
        '공개 가능한 release가 없습니다.',
        availableVersions,
      );
    const matching = (release: (typeof releases)[number]) =>
      !packageId ||
      release.packages.some(
        (entry) => entry.id === packageId && (!input.version || entry.version === input.version),
      );
    const latest = releases.find((entry) => entry.releaseId === index.latestReleaseId);
    const entry = explicit ?? (latest && matching(latest) ? latest : releases.findLast(matching));
    if (!entry)
      throw new KnowledgeError(
        input.version && availableVersions.length ? 'VERSION_NOT_FOUND' : 'PACKAGE_NOT_FOUND',
        '사용 가능한 package 또는 version이 없습니다.',
        availableVersions,
      );
    const selected = packageId ? entry.packages.find((item) => item.id === packageId) : undefined;
    if (packageId && !selected)
      throw new KnowledgeError(
        'PACKAGE_NOT_FOUND',
        '이 release에 package가 없습니다.',
        availableVersions,
      );
    if (input.version && selected?.version !== input.version)
      throw new KnowledgeError(
        'VERSION_MISMATCH',
        '요청한 package version과 release가 일치하지 않습니다.',
        availableVersions,
      );
    const release = await archivedRelease(entry);
    return { release, entry, selected, packageId, availableVersions };
  }
  const metadata = (
    releaseId: string,
    packageName: string | null,
    version: string | null,
    files: readonly string[],
  ) => ({
    schemaVersion: 1 as const,
    releaseId,
    package: packageName,
    packageVersion: version,
    sourceUrls: files.map((file) => sourceUrl(releaseId, file)),
  });
  async function dataset(input: {
    readonly package: string;
    readonly version?: string;
    readonly releaseId?: string;
  }) {
    const selected = await resolve(input);
    if (!selected.packageId || !selected.selected)
      throw new KnowledgeError('PACKAGE_NOT_FOUND', 'package를 지정해야 합니다.');
    const dataset = archivedPackageKnowledgeSchema.parse(
      JSON.parse(
        (await readArchivedFile(selected.release, `api/${selected.packageId}.json`)).toString(
          'utf8',
        ),
      ),
    );
    if (dataset.name !== selected.selected.name || dataset.version !== selected.selected.version)
      throw new KnowledgeError(
        'INTEGRITY_MISMATCH',
        'API 데이터와 release package 정보가 일치하지 않습니다.',
      );
    return {
      ...selected,
      dataset,
      meta: metadata(selected.entry.releaseId, dataset.name, dataset.version, [
        `/api/${selected.packageId}.json`,
      ]),
    };
  }
  async function sources(release: ArchivedRelease, packageId: string) {
    const manifest = sourceManifestSchema.parse(
      JSON.parse(
        (await readArchivedFile(release, `catalogs/${packageId}.sources.json`)).toString('utf8'),
      ),
    );
    const entry = release.entry.packages.find((entry) => entry.id === packageId);
    if (!entry || manifest.package !== entry.name || manifest.packageVersion !== entry.version)
      throw new KnowledgeError(
        'INTEGRITY_MISMATCH',
        '예제 manifest의 package version이 일치하지 않습니다.',
      );
    return manifest;
  }
  return { sourceUrl, eligible, archivedRelease, resolve, metadata, dataset, sources };
}

export type KnowledgeArchive = ReturnType<typeof createKnowledgeArchive>;
