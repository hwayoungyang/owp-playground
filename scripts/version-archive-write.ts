import { randomUUID } from 'node:crypto';
import { cp, lstat, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  knowledgeReleaseSchema, releaseIndexEntrySchema, releaseIndexSchema,
  type KnowledgeRelease, type ReleaseIndexEntry,
} from '../src/features/releases/model/schema.ts';
import { validateArchivedBuild } from './version-archive-build.ts';
import {
  archiveFileFingerprint, collectArchiveFiles, ensureArchiveDirectory, filesystemErrorCode,
  parseArchiveData, VersionArchiveError,
} from './version-archive-files.ts';
import { readVersionArchive } from './version-archive.ts';

export type ArchiveReleaseMetadata = Omit<KnowledgeRelease, 'schemaVersion' | 'files' | 'packages'>;
export type ArchiveBuild = {
  readonly archiveRoot: string;
  readonly directory: string;
  readonly release: ArchiveReleaseMetadata;
  readonly installedPackages?: Readonly<Record<string, string>>;
};
export type ArchiveCommitter = { readonly commitIndex: typeof rename };

export async function withVersionArchiveLock<T>(archiveRoot: string, action: () => Promise<T>): Promise<T> {
  const root = await ensureArchiveDirectory(archiveRoot);
  const lock = path.join(root, '.archive.lock');
  try { await mkdir(lock); }
  catch (error) {
    if (filesystemErrorCode(error) === 'EEXIST') throw new VersionArchiveError('ARCHIVE_LOCKED', '다른 프로세스가 버전 아카이브를 사용 중입니다.', { cause: error });
    throw error;
  }
  try { return await action(); }
  finally { await rm(lock, { recursive: true, force: true }); }
}

export async function commitArchivedBuild(build: ArchiveBuild, committer: ArchiveCommitter = { commitIndex: rename }): Promise<ReleaseIndexEntry> {
  const root = await ensureArchiveDirectory(build.archiveRoot);
  const versions = await ensureArchiveDirectory(path.join(root, 'versions'));
  const packages = await validateArchivedBuild(build.directory, build.release.basePath);
  if (build.installedPackages && packages.some((entry) => build.installedPackages?.[entry.name] !== entry.version)) {
    throw new VersionArchiveError('BUILD_CONTEXT_CHANGED', '설치된 패키지와 빌드 dataset의 버전이 다릅니다.');
  }
  const original = await collectArchiveFiles(build.directory);
  if (Object.hasOwn(original, 'knowledge-release.json')) {
    throw new VersionArchiveError('INVALID_DATA', '빌드에 예약된 knowledge-release.json이 이미 있습니다.');
  }
  const manifest = parseArchiveData(knowledgeReleaseSchema, { schemaVersion: 1, ...build.release, packages, files: original }, 'release metadata');
  let previous;
  try { previous = await readVersionArchive(root); }
  catch (error) {
    if (!(error instanceof VersionArchiveError) || error.code !== 'ARCHIVE_NOT_FOUND') throw error;
  }
  const destination = path.join(versions, manifest.releaseId);
  try {
    await lstat(destination);
    throw new VersionArchiveError('RELEASE_EXISTS', `같은 releaseId를 덮어쓸 수 없습니다: ${manifest.releaseId}`);
  } catch (error) {
    if (filesystemErrorCode(error) !== 'ENOENT') throw error;
  }
  const stage = await mkdtemp(path.join(root, '.staging-'));
  const content = path.join(stage, 'content');
  let published = false;
  let indexed = false;
  try {
    await cp(build.directory, content, { recursive: true, dereference: false, errorOnExist: true });
    const copied = await collectArchiveFiles(content);
    if (JSON.stringify(original) !== JSON.stringify(copied)) {
      throw new VersionArchiveError('INTEGRITY_MISMATCH', '빌드 복사 중 원본 파일이 변경됐습니다.');
    }
    const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(path.join(content, 'knowledge-release.json'), manifestBytes, { flag: 'wx' });
    const entry = parseArchiveData(releaseIndexEntrySchema, {
      releaseId: manifest.releaseId, createdAt: manifest.createdAt, basePath: manifest.basePath,
      packages: manifest.packages, manifestSha256: archiveFileFingerprint(manifestBytes).sha256, channel: manifest.channel,
    }, 'release index entry');
    const next = parseArchiveData(releaseIndexSchema, {
      schemaVersion: 1, latestReleaseId: manifest.releaseId, releases: [...(previous?.releases ?? []), entry],
    }, 'release index');
    const stagedIndex = path.join(stage, `index-${randomUUID()}.json`);
    await writeFile(stagedIndex, `${JSON.stringify(next, null, 2)}\n`, { flag: 'wx' });
    await rename(content, destination);
    published = true;
    await committer.commitIndex(stagedIndex, path.join(versions, 'index.json'));
    indexed = true;
    return entry;
  } finally {
    if (published && !indexed) await rm(destination, { recursive: true, force: true });
    await rm(stage, { recursive: true, force: true });
  }
}

export async function archivePlaygroundBuild(build: ArchiveBuild, committer?: ArchiveCommitter): Promise<ReleaseIndexEntry> {
  return withVersionArchiveLock(build.archiveRoot, () => commitArchivedBuild(build, committer));
}
