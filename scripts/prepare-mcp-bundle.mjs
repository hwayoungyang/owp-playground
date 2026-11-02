import { execFile } from 'node:child_process';
import { chmod, lstat, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileSha256 } from './deploy-artifact.mjs';
import { prepareMcpBundle } from './deploy-mcp-bundle.mjs';
import { readArchivedFile, readArchivedRelease } from './version-archive.ts';
import { assertArchiveDirectory, ensureArchiveDirectory, filesystemErrorCode } from './version-archive-files.ts';

const execute = promisify(execFile);

/** 검증한 stable 하나와 같은 commit의 소스를 불변 배포 묶음으로 보관합니다. */
export async function createMcpDeploymentBundle({ repoRoot, archiveRoot, releaseId, outputRoot = path.join(repoRoot, '.omo/evidence/versioned-mcp') }) {
  const { stdout } = await execute('git', ['rev-parse', 'HEAD'], { cwd: repoRoot });
  const head = stdout.trim();
  const clean = async () => {
    const result = await execute('git', ['status', '--porcelain=v1'], { cwd: repoRoot });
    const current = await execute('git', ['rev-parse', 'HEAD'], { cwd: repoRoot });
    if (result.stdout.trim() || current.stdout.trim() !== head) throw new Error('MCP 묶음 준비에는 변경되지 않은 clean commit이 필요합니다.');
  };
  await clean();
  const selected = await readArchivedRelease(archiveRoot, releaseId);
  if (selected.manifest.channel !== 'stable' || selected.manifest.dirty || !head.startsWith(selected.manifest.commit)) {
    throw new Error('현재 commit과 같은 clean stable 스냅샷을 먼저 준비해 주세요.');
  }
  outputRoot = await ensureArchiveDirectory(outputRoot);
  const destination = path.join(outputRoot, `deploy-bundle-${releaseId}`);
  let exists = false;
  try {
    await lstat(destination);
    exists = true;
  } catch (error) {
    if (filesystemErrorCode(error) !== 'ENOENT') throw error;
  }
  if (exists) {
    const existing = await prepareMcpBundle(destination);
    try {
      if (existing.metadata.head !== head || existing.metadata.releaseId !== releaseId) throw new Error('기존 MCP 묶음의 commit 또는 스냅샷이 다릅니다.');
      return destination;
    } finally { await existing.cleanup(); }
  }
  const stage = await mkdtemp(path.join(outputRoot, '.prepare-mcp-'));
  try {
    await chmod(stage, 0o700);
    const archive = path.join(stage, 'archive');
    const directory = path.join(archive, 'versions', releaseId);
    await mkdir(directory, { recursive: true });
    for (const file of [...Object.keys(selected.manifest.files), 'knowledge-release.json']) {
      const target = path.join(directory, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, await readArchivedFile(selected, file), { flag: 'wx', mode: 0o644 });
    }
    await writeFile(path.join(archive, 'versions/index.json'), `${JSON.stringify({ schemaVersion: 1, latestReleaseId: releaseId, releases: [selected.entry] }, null, 2)}\n`, { flag: 'wx' });
    await execute('git', ['archive', '--format=tar.gz', `--output=${path.join(stage, 'app.tar.gz')}`, head], { cwd: repoRoot });
    await execute('tar', ['--format=ustar', '-C', archive, '-czf', path.join(stage, 'archive.tar.gz'), 'versions'], { env: { ...process.env, COPYFILE_DISABLE: '1' } });
    const files = {};
    for (const name of ['app.tar.gz', 'archive.tar.gz']) {
      const file = path.join(stage, name);
      await chmod(file, 0o600);
      files[name] = { bytes: (await lstat(file)).size, sha256: await fileSha256(file) };
    }
    const metadata = { head, releaseId, manifestCommit: selected.manifest.commit, sourceTarCommit: head, dirty: false, channel: 'stable', packages: selected.manifest.packages, stableReleaseIds: [releaseId], files };
    await writeFile(path.join(stage, 'release.json'), `${JSON.stringify(metadata, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    await writeFile(path.join(stage, 'SHA256SUMS'), Object.entries(files).map(([name, file]) => `${file.sha256}  ${name}\n`).join(''), { flag: 'wx', mode: 0o600 });
    await rm(archive, { recursive: true });
    const verified = await prepareMcpBundle(stage);
    await verified.cleanup();
    await clean();
    await assertArchiveDirectory(outputRoot);
    await rename(stage, destination);
    return destination;
  } finally { await rm(stage, { recursive: true, force: true }); }
}
