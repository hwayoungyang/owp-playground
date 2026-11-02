#!/usr/bin/env node
import { parseArgs } from 'node:util';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, rmdir } from 'node:fs/promises';
import { snapshotPlayground } from './version-archive-snapshot.mjs';
import { readSnapshotBuildContext } from './version-archive-context.mjs';
import { readArchivedRelease, readVersionArchive } from './version-archive.ts';
import { ensureArchiveDirectory, filesystemErrorCode } from './version-archive-files.ts';
import { prepareStaticDeployment } from './deploy-prepared.mjs';
import { createMcpDeploymentBundle } from './prepare-mcp-bundle.mjs';
import { prepareMcpBundle } from './deploy-mcp-bundle.mjs';
import { prepareCachedMcpOffline } from './deploy-mcp-prepared.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

async function currentStable(archiveRoot, context) {
  let index;
  try { index = await readVersionArchive(archiveRoot); }
  catch (error) {
    if (error.code === 'ARCHIVE_NOT_FOUND' || filesystemErrorCode(error) === 'ENOENT') return undefined;
    throw error;
  }
  const candidates = index.releases.filter((entry) => entry.channel === 'stable' && entry.releaseId.endsWith(`-${context.commit}`));
  const entry = candidates.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!entry) return undefined;
  const selected = await readArchivedRelease(archiveRoot, entry.releaseId);
  if (selected.manifest.dirty || selected.manifest.commit !== context.commit || selected.manifest.packages.some((item) => context.packages[item.name] !== item.version)) {
    throw new Error('현재 commit의 stable 스냅샷과 설치 패키지가 다릅니다. 설치 상태를 확인해 주세요.');
  }
  return entry;
}

/** 서버에 접속하지 않고 정적 사이트와 MCP의 배포 자료를 준비합니다. */
async function prepareMaterials() {
  const archiveRoot = path.join(repoRoot, '.playground-versions');
  const context = await readSnapshotBuildContext(repoRoot);
  if (context.dirty) throw new Error('pnpm deploy:prepare는 clean Git tree가 필요합니다. Knowledge와 변경 사항을 검토·커밋한 뒤 다시 실행해 주세요.');
  console.log(`배포 사전 준비: ${context.commit}`);
  const snapshot = await currentStable(archiveRoot, context) ?? await snapshotPlayground({ repoRoot, archiveRoot, channel: 'stable' });
  console.log(`stable 스냅샷 준비: ${snapshot.releaseId}`);
  const playground = await prepareStaticDeployment({ repoRoot, archiveRoot });
  console.log('Playground artifact 준비: OK');
  const bundleDirectory = await createMcpDeploymentBundle({ repoRoot, archiveRoot, releaseId: snapshot.releaseId });
  const bundle = await prepareMcpBundle(bundleDirectory);
  try {
    const offline = await prepareCachedMcpOffline(bundle, { log: console.log });
    const actual = await readSnapshotBuildContext(repoRoot);
    if (actual.dirty || actual.fingerprint !== context.fingerprint) throw new Error('배포 자료 준비 중 소스·설정·설치 패키지가 변경됐습니다. 다시 준비해 주세요.');
    return { stage: 'prepared', commit: context.commit, releaseId: snapshot.releaseId, playground, mcp: { bundle: bundleDirectory, reused: offline.reused, files: offline.transferFiles }, commands: ['pnpm deploy -- --prepared-only', 'pnpm deploy:mcp --prepared-only'] };
  } finally { await bundle.cleanup(); }
}

export async function prepareDeployment() {
  const root = await ensureArchiveDirectory(path.join(repoRoot, '.omo/evidence/deploy-prepared'));
  const lock = path.join(root, '.prepare.lock');
  try { await mkdir(lock, { mode: 0o700 }); }
  catch (error) {
    if (filesystemErrorCode(error) === 'EEXIST') throw new Error('다른 배포 사전 준비가 진행 중이거나 이전 잠금이 남아 있습니다. 실행 상태를 확인해 주세요.');
    throw error;
  }
  try { return await prepareMaterials(); }
  finally { await rmdir(lock); }
}

export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args: args[0] === '--' ? args.slice(1) : args, options: { help: { type: 'boolean', short: 'h' } }, allowPositionals: false, strict: true });
  if (values.help) {
    console.log('사용법: pnpm deploy:prepare\nclean commit의 stable 스냅샷·Playground artifact·MCP 묶음·Linux 의존성을 미리 준비합니다. 서버 접속·배포는 실행하지 않습니다.\n배포 시 pnpm deploy -- --prepared-only 및 pnpm deploy:mcp --prepared-only를 실행하세요.');
    return;
  }
  console.log(JSON.stringify(await prepareDeployment(), null, 2));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main().catch((error) => {
  console.error(`배포 사전 준비 중단: ${error.message}`);
  process.exitCode = 1;
});
