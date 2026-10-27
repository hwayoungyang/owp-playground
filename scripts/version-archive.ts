import {
  knowledgeReleaseSchema, releaseIdSchema, releaseIndexSchema, releasePackageIdSchema,
  type KnowledgeRelease, type ReleaseIndex, type ReleaseIndexEntry,
} from '../src/features/releases/model/schema.ts';
import {
  archiveFileFingerprint, assertArchiveDirectory, collectArchiveFiles, filesystemErrorCode,
  parseArchiveData, parseArchiveJson, readArchiveBytes, safeArchivePath, verifyArchiveFingerprint,
  VersionArchiveError,
} from './version-archive-files.ts';
import { archivedPackageKnowledgeSchema, type ArchivedPackageKnowledge } from './version-archive-build.ts';

export { VersionArchiveError } from './version-archive-files.ts';
export { archivePlaygroundBuild } from './version-archive-write.ts';
export type ArchivedRelease = {
  readonly directory: string;
  readonly entry: ReleaseIndexEntry;
  readonly manifest: KnowledgeRelease;
};

/** 검증한 index entry에 해당하는 manifest와 전체 파일의 무결성을 확인합니다. */
export async function readReleaseEntry(archiveRoot: string, entry: ReleaseIndexEntry): Promise<ArchivedRelease> {
  const directory = safeArchivePath(archiveRoot, `versions/${entry.releaseId}`);
  const bytes = await readArchiveBytes(directory, 'knowledge-release.json');
  if (archiveFileFingerprint(bytes).sha256 !== entry.manifestSha256) {
    throw new VersionArchiveError('INTEGRITY_MISMATCH', `manifest SHA-256이 다릅니다: ${entry.releaseId}`);
  }
  const manifest = parseArchiveJson(knowledgeReleaseSchema, bytes, `${entry.releaseId} manifest`);
  if (manifest.releaseId !== entry.releaseId || manifest.createdAt !== entry.createdAt ||
      manifest.basePath !== entry.basePath || manifest.channel !== entry.channel ||
      JSON.stringify(manifest.packages) !== JSON.stringify(entry.packages)) {
    throw new VersionArchiveError('INTEGRITY_MISMATCH', `index와 manifest 정보가 다릅니다: ${entry.releaseId}`);
  }
  const actualFiles = await collectArchiveFiles(directory);
  const expected = { ...manifest.files, 'knowledge-release.json': archiveFileFingerprint(bytes) };
  if (Object.keys(actualFiles).length !== Object.keys(expected).length ||
      Object.entries(expected).some(([file, fingerprint]) => actualFiles[file]?.bytes !== fingerprint.bytes || actualFiles[file]?.sha256 !== fingerprint.sha256)) {
    throw new VersionArchiveError('INTEGRITY_MISMATCH', `아카이브 파일 목록 또는 SHA-256이 다릅니다: ${entry.releaseId}`);
  }
  return { directory, entry, manifest };
}

export async function readVersionArchive(archiveRoot: string): Promise<ReleaseIndex> {
  let bytes: Buffer;
  try {
    await assertArchiveDirectory(archiveRoot);
    bytes = await readArchiveBytes(archiveRoot, 'versions/index.json');
  } catch (error) {
    if (filesystemErrorCode(error) === 'ENOENT') {
      throw new VersionArchiveError('ARCHIVE_NOT_FOUND', '버전 아카이브 index가 없습니다.', { cause: error });
    }
    throw error;
  }
  const index = parseArchiveJson(releaseIndexSchema, bytes, 'versions/index.json');
  for (const entry of index.releases) await readReleaseEntry(archiveRoot, entry);
  return index;
}

export async function readArchivedRelease(archiveRoot: string, releaseId: string): Promise<ArchivedRelease> {
  const id = parseArchiveData(releaseIdSchema, releaseId, 'releaseId');
  const index = await readVersionArchive(archiveRoot);
  const entry = index.releases.find((candidate) => candidate.releaseId === id);
  if (!entry) throw new VersionArchiveError('RELEASE_NOT_FOUND', `릴리스가 없습니다: ${id}`);
  return readReleaseEntry(archiveRoot, entry);
}

export async function readArchivedFile(release: ArchivedRelease, relativePath: string): Promise<Buffer> {
  safeArchivePath(release.directory, relativePath);
  if (relativePath === 'knowledge-release.json') {
    const bytes = await readArchiveBytes(release.directory, relativePath);
    if (archiveFileFingerprint(bytes).sha256 !== release.entry.manifestSha256) {
      throw new VersionArchiveError('INTEGRITY_MISMATCH', `manifest SHA-256이 다릅니다: ${release.entry.releaseId}`);
    }
    return bytes;
  }
  const expected = Object.hasOwn(release.manifest.files, relativePath) ? release.manifest.files[relativePath] : undefined;
  if (!expected) throw new VersionArchiveError('UNSAFE_PATH', `manifest에 없는 파일입니다: ${relativePath}`);
  const bytes = await readArchiveBytes(release.directory, relativePath);
  verifyArchiveFingerprint(bytes, expected, relativePath);
  return bytes;
}

export async function readArchivedPackage(archiveRoot: string, selection: {
  readonly releaseId: string;
  readonly packageId: string;
  readonly version?: string;
}): Promise<{ readonly release: ArchivedRelease; readonly dataset: ArchivedPackageKnowledge }> {
  const packageId = parseArchiveData(releasePackageIdSchema, selection.packageId, 'packageId');
  const release = await readArchivedRelease(archiveRoot, selection.releaseId);
  const entry = release.manifest.packages.find((candidate) => candidate.id === packageId);
  if (!entry) throw new VersionArchiveError('PACKAGE_NOT_FOUND', `릴리스에 패키지가 없습니다: ${packageId}`);
  if (selection.version !== undefined && selection.version !== entry.version) {
    throw new VersionArchiveError('VERSION_MISMATCH', `요청한 패키지 버전이 없습니다: ${packageId}@${selection.version}`);
  }
  const dataset = parseArchiveJson(archivedPackageKnowledgeSchema,
    await readArchivedFile(release, `api/${packageId}.json`), `${packageId} API dataset`);
  if (dataset.id !== entry.id || dataset.name !== entry.name || dataset.version !== entry.version) {
    throw new VersionArchiveError('INTEGRITY_MISMATCH', `manifest와 API dataset 정보가 다릅니다: ${packageId}`);
  }
  return { release, dataset };
}
