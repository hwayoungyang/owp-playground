import { constants } from 'node:fs';
import { chmod, lstat, mkdtemp, open, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { releaseIdSchema, releasePackageSchema, releaseFileSchema } from '../src/features/releases/model/schema.ts';
import { readArchivedRelease, readVersionArchive } from './version-archive.ts';
import { assertArchiveDirectory, collectArchiveFiles } from './version-archive-files.ts';
import { readVersionUiRuntime } from './version-presentation.ts';
import { readArchivedFile } from './version-archive.ts';
import { extractMcpTar, inspectMcpTar, sha256 } from './deploy-mcp-tar.mjs';

const metadataSchema = z.object({
  head: z.string().regex(/^[0-9a-f]{40}$/), releaseId: releaseIdSchema,
  channel: z.literal('stable'), dirty: z.literal(false), manifestCommit: z.string().regex(/^[0-9a-f]{7,40}$/),
  packages: z.array(releasePackageSchema).min(1), stableReleaseIds: z.array(releaseIdSchema).min(1),
  sourceTarCommit: z.string().regex(/^[0-9a-f]{40}$/).optional(),
  files: z.object({ 'app.tar.gz': releaseFileSchema, 'archive.tar.gz': releaseFileSchema }).strict(),
});
const names = ['release.json', 'SHA256SUMS', 'app.tar.gz', 'archive.tar.gz'];
const metadataLimit = 1024 * 1024;
export const defaultMcpBundleRoot = fileURLToPath(new URL('../.omo/evidence/versioned-mcp', import.meta.url));

function parseMetadata(bytes) {
  const metadata = metadataSchema.parse(JSON.parse(bytes.toString('utf8')));
  if (new Set(metadata.stableReleaseIds).size !== metadata.stableReleaseIds.length || new Set(metadata.packages.map((entry) => entry.id)).size !== metadata.packages.length ||
      (metadata.sourceTarCommit && metadata.sourceTarCommit !== metadata.head)) throw new Error('묶음 commit 또는 릴리스 ID가 올바르지 않습니다.');
  return metadata;
}

function releaseTimestamp(releaseId) {
  const timestamp = /^(\d{8}-\d{6})-/.exec(releaseId)?.[1];
  if (!timestamp) throw new Error('releaseId에는 YYYYMMDD-HHMMSS 시간 접두사가 필요합니다.');
  const iso = `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}T${timestamp.slice(9, 11)}:${timestamp.slice(11, 13)}:${timestamp.slice(13, 15)}.000Z`;
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== iso) throw new Error('releaseId의 날짜 또는 시간이 올바르지 않습니다.');
  return timestamp;
}

async function readBounded(handle, limit) {
  const bytes = Buffer.alloc(limit + 1);
  let length = 0;
  while (length < bytes.length) {
    const { bytesRead } = await handle.read(bytes, length, bytes.length - length, null);
    if (bytesRead === 0) break;
    length += bytesRead;
  }
  if (length > limit) throw new Error('묶음 메타데이터 크기 상한을 초과했습니다.');
  return bytes.subarray(0, length);
}

async function readCandidateMetadata(file) {
  let info;
  try { info = await lstat(file); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
  if (!info.isFile() || info.isSymbolicLink() || info.size > metadataLimit) throw new Error('release.json에는 1MiB 이하의 일반 파일이 필요합니다.');
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const actual = await handle.stat();
    if (!actual.isFile() || actual.size > metadataLimit) throw new Error('release.json 파일이 변경됐거나 크기 상한을 초과했습니다.');
    return await readBounded(handle, metadataLimit);
  } finally { await handle.close(); }
}

export async function selectMcpBundle(bundleRoot = defaultMcpBundleRoot) {
  const root = path.resolve(bundleRoot);
  let entries;
  try {
    await assertArchiveDirectory(root);
    entries = await readdir(root);
  } catch (cause) {
    throw new Error(`기본 배포 묶음 경로를 읽을 수 없습니다: ${root}. 준비된 묶음을 --bundle DIR로 지정해 주세요.`, { cause });
  }
  const candidates = [];
  for (const name of entries.filter((entry) => entry.startsWith('deploy-bundle-')).sort()) {
    const source = path.join(root, name);
    const file = path.join(source, 'release.json');
    try {
      const info = await lstat(source);
      if (info.isSymbolicLink()) throw new Error('배포 묶음 후보에 symlink를 사용할 수 없습니다.');
      if (!info.isDirectory()) continue;
      const bytes = await readCandidateMetadata(file);
      if (!bytes) continue;
      const advertised = JSON.parse(bytes.toString('utf8'));
      if (advertised?.channel === 'draft' || advertised?.dirty === true) continue;
      const metadata = parseMetadata(bytes);
      candidates.push({ source, metadata, metadataSha256: sha256(bytes), timestamp: releaseTimestamp(metadata.releaseId) });
    } catch (cause) {
      throw new Error(`배포 묶음 후보를 검사할 수 없습니다: ${file}. ${cause.message} 준비된 묶음을 --bundle DIR로 지정해 주세요.`, { cause });
    }
  }
  if (!candidates.length) throw new Error(`자동 선택할 clean stable 배포 묶음이 없습니다: ${root}. 준비된 묶음을 --bundle DIR로 지정해 주세요.`);
  const newest = candidates.reduce((latest, candidate) => candidate.timestamp > latest ? candidate.timestamp : latest, '');
  const latest = candidates.filter((candidate) => candidate.timestamp === newest);
  if (latest.length !== 1) throw new Error(`최신 배포 묶음의 시간이 같아 자동 선택할 수 없습니다: ${latest.map((candidate) => candidate.source).join(', ')}. --bundle DIR로 하나를 지정해 주세요.`);
  return latest[0];
}

async function freezeFile(source, destination, metadataBytes) {
  const limit = metadataBytes ?? 64 * 1024 * 1024;
  const info = await lstat(source);
  if (!info.isFile() || info.isSymbolicLink() || info.size > limit) throw new Error(`묶음에는 크기 상한 이하의 일반 파일이 필요합니다: ${source}`);
  const handle = await open(source, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const actual = await handle.stat();
    if (!actual.isFile() || actual.size > limit) throw new Error('묶음 파일이 변경됐습니다.');
    const bytes = metadataBytes === undefined ? await handle.readFile() : await readBounded(handle, limit);
    if (bytes.length > limit) throw new Error('묶음 파일 크기 상한을 초과했습니다.');
    await writeFile(destination, bytes, { flag: 'wx', mode: 0o600 });
    return bytes;
  } finally { await handle.close(); }
}

export async function validateMcpArchive(archiveRoot, metadata) {
  const index = await readVersionArchive(archiveRoot);
  if (index.latestReleaseId !== metadata.releaseId || index.releases.some((entry) => entry.channel !== 'stable') ||
      JSON.stringify(index.releases.map((entry) => entry.releaseId).sort()) !== JSON.stringify(metadata.stableReleaseIds.toSorted())) throw new Error('stable index와 release.json의 릴리스 목록 또는 latest가 다릅니다.');
  const files = await collectArchiveFiles(archiveRoot);
  const allowed = new Set(['versions/index.json']);
  let selected;
  for (const entry of index.releases) {
    const release = await readArchivedRelease(archiveRoot, entry.releaseId);
    if (release.manifest.dirty || release.manifest.channel !== 'stable') throw new Error('clean stable manifest만 배포할 수 있습니다.');
    for (const file of [...Object.keys(release.manifest.files), 'knowledge-release.json']) allowed.add(`versions/${entry.releaseId}/${file}`);
    if (entry.releaseId === metadata.releaseId) selected = release;
  }
  if (Object.keys(files).some((file) => !allowed.has(file)) || !selected) throw new Error('archive에 index 밖의 파일이 있습니다.');
  if (selected.manifest.commit !== metadata.manifestCommit || !metadata.head.startsWith(selected.manifest.commit) ||
      !metadata.releaseId.endsWith(`-${selected.manifest.commit}`) || JSON.stringify(selected.manifest.packages) !== JSON.stringify(metadata.packages)) throw new Error('release.json과 manifest의 commit·packages 정보가 다릅니다.');
  const asset = Object.keys(selected.manifest.files).find((file) => /^assets\/.+\.(?:js|css)$/.test(file));
  if (!selected.manifest.files['index.html'] || !asset) throw new Error('릴리스 index.html 또는 실제 asset이 없습니다.');
  await readVersionUiRuntime(selected.entry.basePath, (file) => readArchivedFile(selected, file));
  return { index, manifest: selected.manifest, asset };
}

export async function prepareMcpBundle(bundleDirectory, options = {}) {
  const selection = bundleDirectory === undefined ? await selectMcpBundle(options.bundleRoot) : undefined;
  bundleDirectory = selection?.source ?? bundleDirectory;
  if (typeof bundleDirectory !== 'string' || !bundleDirectory.trim()) throw new Error('--bundle DIR에는 비어 있지 않은 경로가 필요합니다.');
  const source = await assertArchiveDirectory(path.resolve(bundleDirectory));
  const directory = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-mcp-deploy-')));
  const cleanup = () => rm(directory, { recursive: true, force: true });
  try {
    await chmod(directory, 0o700);
    const frozen = {};
    for (const name of names) frozen[name] = await freezeFile(path.join(source, name), path.join(directory, name), name === 'release.json' ? metadataLimit : name === 'SHA256SUMS' ? 4096 : undefined);
    if (frozen['release.json'].length > metadataLimit || frozen.SHA256SUMS.length > 4096) throw new Error('묶음 메타데이터 크기 상한을 초과했습니다.');
    const expectedMetadataSha256 = selection?.metadataSha256 ?? options.expectedMetadataSha256;
    if (expectedMetadataSha256 && sha256(frozen['release.json']) !== expectedMetadataSha256) throw new Error(`선택 후 release.json이 변경됐습니다: ${source}. --bundle DIR로 확인한 묶음을 지정해 주세요.`);
    const metadata = parseMetadata(frozen['release.json']);
    const sums = frozen.SHA256SUMS.toString('utf8').trim().split('\n');
    const expected = Object.entries(metadata.files).map(([name, entry]) => `${entry.sha256}  ${name}`).sort();
    if (JSON.stringify(sums.toSorted()) !== JSON.stringify(expected)) throw new Error('SHA256SUMS와 release.json이 다릅니다.');
    for (const [name, entry] of Object.entries(metadata.files)) {
      if (frozen[name].length !== entry.bytes || sha256(frozen[name]) !== entry.sha256) throw new Error(`묶음 파일 크기 또는 SHA-256이 다릅니다: ${name}`);
    }
    const appTar = inspectMcpTar(frozen['app.tar.gz']);
    if (appTar.comment !== metadata.head) throw new Error('source tar commit comment와 release.json head가 다릅니다.');
    const sourceFiles = new Set(appTar.entries.filter((entry) => !entry.directory).map((entry) => entry.name));
    for (const file of ['mcp/cli.ts', 'package.json', 'pnpm-lock.yaml', 'scripts/version-archive.ts', 'src/features/releases/model/schema.ts']) if (!sourceFiles.has(file)) throw new Error(`source tar 필수 파일이 없습니다: ${file}`);
    await extractMcpTar(appTar, path.join(directory, 'app'));
    const project = JSON.parse(await readFile(path.join(directory, 'app/package.json'), 'utf8'));
    if (project.packageManager !== 'pnpm@12.15.0' || project.devEngines?.runtime?.version !== '24.22.1') throw new Error('source의 Node 24.22.1·pnpm 12.15.0 계약이 다릅니다.');
    await extractMcpTar(inspectMcpTar(frozen['archive.tar.gz']), path.join(directory, 'archive'));
    const archive = await validateMcpArchive(path.join(directory, 'archive'), metadata);
    return { source, directory, metadata, ...archive, transferFiles: names.map((name) => ({ name, bytes: frozen[name].length, sha256: sha256(frozen[name]) })), cleanup };
  } catch (error) {
    await cleanup();
    if (selection) throw new Error(`자동 선택한 배포 묶음 검증에 실패했습니다: ${source} (${selection.metadata.releaseId}). ${error.message} 준비된 묶음을 --bundle DIR로 지정해 주세요.`, { cause: error });
    throw error;
  }
}
