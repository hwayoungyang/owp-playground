import { cp, mkdir, readFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { optionalStat, assertRealAncestors } from './deploy-mcp-preflight.mjs';

export async function prepareMcpArchiveMerge(context) {
  const { appDirectory, incoming, config, metadata, owner } = context;
  const reader = await import(pathToFileURL(path.join(appDirectory, 'scripts/version-archive.ts')).href);
  const files = await import(pathToFileURL(path.join(appDirectory, 'scripts/version-archive-files.ts')).href);
  const source = path.join(incoming, 'archive');
  const root = path.join(config.remoteRoot, 'archive');
  const fresh = await reader.readVersionArchive(source);
  if (fresh.latestReleaseId !== metadata.releaseId || fresh.releases.some((entry) => entry.channel !== 'stable')) throw new Error('수신 archive가 stable latest 계약과 다릅니다.');
  const selected = await reader.readArchivedRelease(source, metadata.releaseId);
  if (selected.manifest.commit !== metadata.manifestCommit || !metadata.head.startsWith(selected.manifest.commit) || selected.manifest.dirty || JSON.stringify(selected.manifest.packages) !== JSON.stringify(metadata.packages)) throw new Error('수신 manifest와 배포 계획이 다릅니다.');
  await assertRealAncestors(root);
  const indexPath = path.join(root, 'versions/index.json');
  const info = await optionalStat(indexPath);
  const previous = info ? await reader.readVersionArchive(root) : undefined;
  if (previous?.releases.some((entry) => entry.channel !== 'stable')) throw new Error('기존 canonical archive에 stable이 아닌 릴리스가 있습니다.');
  const latest = previous?.releases.find((entry) => entry.releaseId === previous.latestReleaseId);
  if (latest && latest.releaseId !== metadata.releaseId && Date.parse(latest.createdAt) >= Date.parse(selected.entry.createdAt)) throw new Error('기존 latest보다 오래되거나 같은 시각의 묶음으로 자동 다운그레이드할 수 없습니다.');
  const releases = [...(previous?.releases ?? [])];
  await mkdir(path.join(root, 'versions'), { recursive: true, mode: 0o755 });
  for (const entry of fresh.releases) {
    const existing = releases.find((item) => item.releaseId === entry.releaseId);
    if (existing && JSON.stringify(existing) !== JSON.stringify(entry)) throw new Error(`같은 releaseId의 내용이 다릅니다: ${entry.releaseId}`);
    const destination = path.join(root, 'versions', entry.releaseId);
    const from = path.join(source, 'versions', entry.releaseId);
    const actual = await optionalStat(destination);
    if (actual) {
      if (!actual.isDirectory() || actual.isSymbolicLink() || JSON.stringify(await files.collectArchiveFiles(destination)) !== JSON.stringify(await files.collectArchiveFiles(from))) throw new Error(`기존 snapshot의 내용이 다릅니다: ${entry.releaseId}`);
    } else {
      const stage = path.join(root, 'versions', `.incoming-${entry.releaseId}-${owner}`);
      if (await optionalStat(stage)) throw new Error('archive 임시 경로가 이미 있습니다.');
      await cp(from, stage, { recursive: true, force: false, errorOnExist: true });
      if (JSON.stringify(await files.collectArchiveFiles(stage)) !== JSON.stringify(await files.collectArchiveFiles(from))) throw new Error('snapshot 복사 검증에 실패했습니다.');
      await rename(stage, destination);
    }
    if (!existing) releases.push(entry);
  }
  const merged = { schemaVersion: 1, latestReleaseId: metadata.releaseId, releases };
  // canonical 디렉터리는 symlink를 허용하지 않으므로 별도 index 대신 각 snapshot을 완전히 검사합니다.
  for (const entry of releases) {
    const expected = await files.collectArchiveFiles(path.join(root, 'versions', entry.releaseId));
    const manifestBytes = await readFile(path.join(root, 'versions', entry.releaseId, 'knowledge-release.json'));
    if (files.archiveFileFingerprint(manifestBytes).sha256 !== entry.manifestSha256) throw new Error('병합 snapshot manifest SHA-256이 다릅니다.');
    const manifest = JSON.parse(manifestBytes.toString('utf8'));
    const fingerprints = { ...manifest.files, 'knowledge-release.json': files.archiveFileFingerprint(manifestBytes) };
    if (Object.keys(expected).length !== Object.keys(fingerprints).length || Object.entries(fingerprints).some(([file, value]) => expected[file]?.sha256 !== value.sha256 || expected[file]?.bytes !== value.bytes)) throw new Error('병합 snapshot 파일 검증에 실패했습니다.');
  }
  return { previousIndex: info ? await readFile(indexPath, 'utf8') : undefined, nextIndex: `${JSON.stringify(merged, null, 2)}\n` };
}
