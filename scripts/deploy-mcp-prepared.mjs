import { open, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { archiveFileFingerprint, filesystemErrorCode } from './version-archive-files.ts';
import { createPreparedStage, preparedDirectoryExists, publishPreparedStage, readPreparedBytes } from './deploy-prepared-files.mjs';
import { assertMcpLinuxExecutable, prepareMcpOffline } from './deploy-mcp-offline.mjs';
import { inspectMcpDependencies, MCP_OFFLINE_LIMITS, validateMcpOfflineManifest } from './deploy-mcp-offline-format.mjs';

const defaultRoot = fileURLToPath(new URL('../.omo/evidence/deploy-prepared/mcp', import.meta.url));
const names = ['runtime-node', 'runtime-pnpm', 'dependencies.bin.gz', 'offline.json'];
const same = isDeepStrictEqual;

async function identity(bundle) {
  const expected = { head: bundle.metadata.head, releaseId: bundle.metadata.releaseId, sourceSha256: bundle.metadata.files['app.tar.gz'].sha256 };
  for (const [file, key] of [['package.json', 'packageSha256'], ['pnpm-lock.yaml', 'lockSha256'], ['pnpm-workspace.yaml', 'workspaceSha256']]) {
    try { expected[key] = archiveFileFingerprint(await readPreparedBytes(path.join(bundle.directory, 'app'), file, 16 * 1024 * 1024)).sha256; }
    catch (error) {
      if (file !== 'pnpm-workspace.yaml' || filesystemErrorCode(error) !== 'ENOENT') throw error;
    }
  }
  const key = archiveFileFingerprint(Buffer.from(JSON.stringify({ ...expected, archiveSha256: bundle.metadata.files['archive.tar.gz'].sha256 }))).sha256;
  return { expected, key };
}

async function verify(directory, expected) {
  const files = {};
  for (const name of names) files[name] = await readPreparedBytes(directory, name, MCP_OFFLINE_LIMITS[name]);
  const manifest = validateMcpOfflineManifest(JSON.parse(files['offline.json'].toString('utf8')), expected);
  if (Object.hasOwn(manifest, 'workspaceSha256') !== Object.hasOwn(expected, 'workspaceSha256')) throw new Error('준비된 MCP workspace 계약이 다릅니다.');
  for (const name of names.filter((name) => name !== 'offline.json')) {
    if (!same(archiveFileFingerprint(files[name]), manifest.files[name])) throw new Error(`준비된 MCP 파일 크기 또는 SHA-256이 다릅니다: ${name}`);
  }
  assertMcpLinuxExecutable(files['runtime-node']);
  assertMcpLinuxExecutable(files['runtime-pnpm']);
  inspectMcpDependencies(files['dependencies.bin.gz'], manifest);
  return { manifest, files, transferFiles: names.map((name) => ({ name, ...archiveFileFingerprint(files[name]) })) };
}

async function copyToBundle(bundle, files) {
  const created = [];
  try {
    for (const name of names) {
      const file = path.join(bundle.directory, name);
      const handle = await open(file, 'wx', 0o600);
      created.push(file);
      try { await handle.writeFile(files[name]); }
      finally { await handle.close(); }
      if (!same(archiveFileFingerprint(await readPreparedBytes(bundle.directory, name, MCP_OFFLINE_LIMITS[name])), archiveFileFingerprint(files[name]))) throw new Error('MCP 준비 파일 복사 검증에 실패했습니다.');
    }
  } catch (error) {
    await Promise.all(created.map((file) => rm(file, { force: true })));
    throw error;
  }
}

export async function readCachedMcpOffline(bundle, { preparedRoot = defaultRoot } = {}) {
  const state = await identity(bundle);
  const directory = path.join(preparedRoot, state.key);
  if (!await preparedDirectoryExists(directory)) return undefined;
  if (!same((await readdir(directory)).sort(), [...names].sort())) throw new Error('MCP 준비 파일 목록이 올바르지 않습니다.');
  const result = await verify(directory, state.expected);
  await copyToBundle(bundle, result.files);
  if (!same(state, await identity(bundle))) throw new Error('준비 파일 조회 중 MCP 원본이 변경됐습니다.');
  return { manifest: result.manifest, transferFiles: result.transferFiles, reused: true, directory };
}

export async function prepareCachedMcpOffline(bundle, { preparedOnly = false, preparedRoot = defaultRoot, log = () => {}, prepareOffline = prepareMcpOffline } = {}) {
  const cached = await readCachedMcpOffline(bundle, { preparedRoot });
  if (cached) {
    log('준비된 MCP Linux 의존성을 재사용합니다. 설치·다운로드·압축을 생략합니다.');
    return cached;
  }
  if (preparedOnly) throw new Error('일치하는 MCP 준비 자료가 없습니다. pnpm deploy:prepare를 먼저 실행해 주세요.');
  const state = await identity(bundle);
  await prepareOffline(bundle, { log });
  const result = await verify(bundle.directory, state.expected);
  const stage = await createPreparedStage(preparedRoot);
  try {
    for (const name of names) await writeFile(path.join(stage, name), result.files[name], { flag: 'wx', mode: 0o600 });
    await verify(stage, state.expected);
    if (!same(state, await identity(bundle))) throw new Error('준비 중 MCP 원본이 변경됐습니다.');
    const directory = path.join(preparedRoot, state.key);
    await publishPreparedStage(stage, directory);
    return { manifest: result.manifest, transferFiles: result.transferFiles, reused: false, directory };
  } finally { await rm(stage, { recursive: true, force: true }); }
}
