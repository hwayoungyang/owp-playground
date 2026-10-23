import { constants } from 'node:fs';
import { chmod, lstat, mkdtemp, open, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { releaseIdSchema, releasePackageSchema, releaseFileSchema } from '../src/features/releases/model/schema.ts';
import { readArchivedRelease, readVersionArchive } from './version-archive.ts';
import { assertArchiveDirectory, collectArchiveFiles } from './version-archive-files.ts';
import { extractMcpTar, inspectMcpTar, sha256 } from './deploy-mcp-tar.mjs';

const metadataSchema = z.object({
  head: z.string().regex(/^[0-9a-f]{40}$/), releaseId: releaseIdSchema,
  channel: z.literal('stable'), dirty: z.literal(false), manifestCommit: z.string().regex(/^[0-9a-f]{7,40}$/),
  packages: z.array(releasePackageSchema).min(1), stableReleaseIds: z.array(releaseIdSchema).min(1),
  sourceTarCommit: z.string().regex(/^[0-9a-f]{40}$/).optional(),
  files: z.object({ 'app.tar.gz': releaseFileSchema, 'archive.tar.gz': releaseFileSchema }).strict(),
});
const names = ['release.json', 'SHA256SUMS', 'app.tar.gz', 'archive.tar.gz'];

async function freezeFile(source, destination) {
  const info = await lstat(source);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 64 * 1024 * 1024) throw new Error('묶음에는 64MiB 이하의 일반 파일이 필요합니다.');
  const handle = await open(source, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const actual = await handle.stat();
    if (!actual.isFile() || actual.size > 64 * 1024 * 1024) throw new Error('묶음 파일이 변경됐습니다.');
    const bytes = await handle.readFile();
    if (bytes.length > 64 * 1024 * 1024) throw new Error('묶음 파일 크기 상한을 초과했습니다.');
    await writeFile(destination, bytes, { flag: 'wx', mode: 0o600 });
    return bytes;
  } finally { await handle.close(); }
}

export async function validateMcpArchive(archiveRoot, metadata) {
  const index = await readVersionArchive(archiveRoot);
  if (index.latestReleaseId !== metadata.releaseId || index.releases.some((entry) => entry.channel !== 'stable') ||
      JSON.stringify(index.releases.map((entry) => entry.releaseId).sort()) !== JSON.stringify([...metadata.stableReleaseIds].sort())) throw new Error('stable index와 release.json의 릴리스 목록 또는 latest가 다릅니다.');
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
  return { index, manifest: selected.manifest, asset };
}

export async function prepareMcpBundle(bundleDirectory) {
  if (typeof bundleDirectory !== 'string' || !bundleDirectory.trim()) throw new Error('--bundle DIR가 필요합니다.');
  const source = await assertArchiveDirectory(path.resolve(bundleDirectory));
  const directory = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-mcp-deploy-')));
  const cleanup = () => rm(directory, { recursive: true, force: true });
  try {
    await chmod(directory, 0o700);
    const frozen = {};
    for (const name of names) frozen[name] = await freezeFile(path.join(source, name), path.join(directory, name));
    if (frozen['release.json'].length > 1024 * 1024 || frozen.SHA256SUMS.length > 4096) throw new Error('묶음 메타데이터 크기 상한을 초과했습니다.');
    const metadata = metadataSchema.parse(JSON.parse(frozen['release.json'].toString('utf8')));
    if (new Set(metadata.stableReleaseIds).size !== metadata.stableReleaseIds.length || new Set(metadata.packages.map((entry) => entry.id)).size !== metadata.packages.length ||
        (metadata.sourceTarCommit && metadata.sourceTarCommit !== metadata.head)) throw new Error('묶음 commit 또는 릴리스 ID가 올바르지 않습니다.');
    const sums = frozen.SHA256SUMS.toString('utf8').trim().split('\n');
    const expected = Object.entries(metadata.files).map(([name, entry]) => `${entry.sha256}  ${name}`).sort();
    if (JSON.stringify([...sums].sort()) !== JSON.stringify(expected)) throw new Error('SHA256SUMS와 release.json이 다릅니다.');
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
    return { directory, metadata, ...archive, transferFiles: names.map((name) => ({ name, bytes: frozen[name].length, sha256: sha256(frozen[name]) })), cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
