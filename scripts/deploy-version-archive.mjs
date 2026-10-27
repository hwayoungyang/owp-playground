import { lstat, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readArchivedFile, readReleaseEntry, readVersionArchive } from './version-archive.ts';
import {
  assertArchiveDirectory, ensureArchiveDirectory, filesystemErrorCode, readArchiveBytes,
  safeArchivePath,
} from './version-archive-files.ts';

export async function copyStableVersionArchive({ archiveRoot, content }, { readFile = readArchivedFile } = {}) {
  await assertArchiveDirectory(content);
  const source = path.resolve(archiveRoot);
  const target = path.resolve(content);
  if (source === target || source.startsWith(`${target}${path.sep}`) || target.startsWith(`${source}${path.sep}`)) {
    throw new Error('원본 버전 아카이브와 artifact 복사 경로는 서로 포함할 수 없습니다.');
  }
  const destination = path.join(content, 'versions');
  try {
    await lstat(destination);
    throw new Error('빌드에 배포용 예약 경로가 이미 있습니다: versions');
  } catch (error) {
    if (filesystemErrorCode(error) !== 'ENOENT') throw error;
  }
  let indexBytes;
  let index;
  try {
    index = await readVersionArchive(archiveRoot);
    indexBytes = await readArchiveBytes(archiveRoot, 'versions/index.json');
  } catch (cause) {
    throw new Error('정적 배포에 필요한 버전 아카이브를 검증하지 못했습니다. .playground-versions의 stable 스냅샷을 준비해 주세요.', { cause });
  }
  const releases = index.releases.filter((entry) => entry.channel === 'stable');
  if (releases.length === 0) {
    throw new Error('정적 배포에 필요한 stable 버전 아카이브가 없습니다. stable 스냅샷을 준비해 주세요.');
  }
  const latest = releases.find((entry) => entry.releaseId === index.latestReleaseId) ??
    releases.toSorted((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.releaseId.localeCompare(left.releaseId))[0];
  const stableIndex = { schemaVersion: 1, latestReleaseId: latest.releaseId, releases };
  await mkdir(destination);
  try {
    for (const entry of releases) {
      const release = await readReleaseEntry(archiveRoot, entry);
      const directory = path.join(destination, entry.releaseId);
      await ensureArchiveDirectory(directory);
      for (const file of [...Object.keys(release.manifest.files), 'knowledge-release.json']) {
        const bytes = await readFile(release, file);
        const target = safeArchivePath(directory, file);
        await ensureArchiveDirectory(path.dirname(target));
        await writeFile(target, bytes, { flag: 'wx', mode: 0o644 });
      }
    }
    await writeFile(path.join(destination, 'index.json'), `${JSON.stringify(stableIndex, null, 2)}\n`, { flag: 'wx', mode: 0o644 });
    const current = await readVersionArchive(archiveRoot);
    if (JSON.stringify(current) !== JSON.stringify(index) ||
        !indexBytes.equals(await readArchiveBytes(archiveRoot, 'versions/index.json'))) {
      throw new Error('버전 아카이브 복사 중 원본 index가 변경됐습니다.');
    }
    await readVersionArchive(content);
    return stableIndex;
  } catch (error) {
    await rm(destination, { recursive: true, force: true });
    throw error;
  }
}
