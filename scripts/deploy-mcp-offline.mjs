import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { chmod, cp, lstat, mkdir, mkdtemp, open, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { MCP_DEPENDENCIES_FILE, MCP_OFFLINE_LIMITS, packMcpDependencies, validateMcpOfflineManifest } from './deploy-mcp-offline-format.mjs';

const execute = promisify(execFile);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fingerprint = (bytes) => ({ bytes: bytes.length, sha256: sha256(bytes) });
export const defaultMcpOfflineCache = fileURLToPath(new URL('../.omo/evidence/mcp-offline/cache', import.meta.url));
export const MCP_OFFLINE_RUNTIMES = Object.freeze({
  'runtime-node': Object.freeze({
    url: 'https://nodejs.org/dist/v24.22.1/node-v24.22.1-linux-x64.tar.gz',
    cacheName: 'node-v24.22.1-linux-x64.tar.gz', member: 'node-v24.22.1-linux-x64/bin/node',
    sha256: 'eb6728e77c576a35162c122c45ccadf224d89ff00abc8dae46cc2897c6002d7c',
    compressedLimit: 128 * 1024 * 1024,
  }),
  'runtime-pnpm': Object.freeze({
    url: 'https://registry.npmjs.org/@pnpm/exe.linux-x64/-/exe.linux-x64-12.15.0.tgz',
    cacheName: 'pnpm-exe-linux-x64-12.15.0.tgz', member: 'package/pnpm',
    integrity: 'sha512-yc+QlZR+9+nr29J4fRzhMoapgxTBDndq/+peyoq1XUufnQFnfbXUMFudDIKzHi545linGqmOmXfn0NoufNgcOg==',
    compressedLimit: 256 * 1024 * 1024,
  }),
});

export function assertMcpLinuxExecutable(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 64 || bytes.readUInt32BE(0) !== 0x7f454c46 || bytes[4] !== 2 || bytes[5] !== 1 || bytes[6] !== 1 || ![2, 3].includes(bytes.readUInt16LE(16)) || bytes.readUInt16LE(18) !== 62) throw new Error('런타임에는 Linux ELF x86_64 실행 파일이 필요합니다.');
}

const tarField = (block, start, length) => block.subarray(start, start + length).toString('utf8').replace(/\0.*$/s, '');
export function extractMcpRuntimeMember(compressed, member, maximum) {
  const bytes = gunzipSync(compressed, { maxOutputLength: 768 * 1024 * 1024 });
  let offset = 0;
  let count = 0;
  let selected;
  let ended = false;
  while (offset + 512 <= bytes.length) {
    const block = bytes.subarray(offset, offset + 512);
    if (block.every((value) => value === 0)) {
      if (offset + 1024 > bytes.length || !bytes.subarray(offset).every((value) => value === 0)) throw new Error('런타임 tar 종료 블록이 올바르지 않습니다.');
      ended = true;
      break;
    }
    if (++count > 100000) throw new Error('런타임 tar 항목 수 상한을 초과했습니다.');
    const checksum = [...block].reduce((sum, value, index) => sum + (index >= 148 && index < 156 ? 32 : value), 0);
    const checksumText = tarField(block, 148, 8).trim();
    const sizeText = tarField(block, 124, 12).trim();
    if (!/^[0-7]+$/.test(checksumText) || Number.parseInt(checksumText, 8) !== checksum || !/^[0-7]+$/.test(sizeText)) throw new Error('런타임 tar checksum 또는 크기가 올바르지 않습니다.');
    const size = Number.parseInt(sizeText, 8);
    const name = [tarField(block, 345, 155), tarField(block, 0, 100)].filter(Boolean).join('/');
    const type = tarField(block, 156, 1) || '0';
    offset += 512;
    if (!Number.isSafeInteger(size) || size > bytes.length - offset) throw new Error('런타임 tar 크기 상한을 초과했습니다.');
    if (name === member) {
      const mode = Number.parseInt(tarField(block, 100, 8).trim(), 8);
      if (selected || type !== '0' || size > maximum || !(mode & 0o111)) throw new Error('런타임 tar의 실행 파일 항목이 올바르지 않습니다.');
      selected = Buffer.from(bytes.subarray(offset, offset + size));
    }
    offset += Math.ceil(size / 512) * 512;
  }
  if (!ended || !selected) throw new Error('런타임 tar에 고정 실행 파일이 없습니다.');
  assertMcpLinuxExecutable(selected);
  return selected;
}

async function downloadBounded(url, maximum) {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(180000) });
  if (!response.ok || !response.body) throw new Error(`공식 런타임 다운로드에 실패했습니다: HTTP ${response.status}`);
  const advertised = response.headers.get('content-length');
  if (advertised && (!/^\d+$/.test(advertised) || Number(advertised) > maximum)) throw new Error('런타임 다운로드 크기 상한을 초과했습니다.');
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > maximum) throw new Error('런타임 다운로드 크기 상한을 초과했습니다.');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks, total);
}

function verifyRuntimeArchive(bytes, spec) {
  if (!Buffer.isBuffer(bytes) || bytes.length > spec.compressedLimit) throw new Error('공식 런타임 압축 파일 크기 상한을 초과했습니다.');
  if (spec.sha256 && sha256(bytes) !== spec.sha256) throw new Error('공식 Node 압축 파일 SHA-256이 다릅니다. cache를 확인해 주세요.');
  if (spec.integrity && `sha512-${createHash('sha512').update(bytes).digest('base64')}` !== spec.integrity) throw new Error('공식 pnpm 압축 파일 integrity가 다릅니다. cache를 확인해 주세요.');
}

async function readBounded(handle, maximum) {
  const chunks = [];
  let total = 0;
  while (total <= maximum) {
    const chunk = Buffer.alloc(Math.min(64 * 1024, maximum + 1 - total));
    const { bytesRead } = await handle.read(chunk, 0, chunk.length, null);
    if (!bytesRead) break;
    total += bytesRead;
    if (total > maximum) throw new Error('오프라인 준비 파일 크기 상한을 초과했습니다.');
    chunks.push(chunk.subarray(0, bytesRead));
  }
  return Buffer.concat(chunks, total);
}

async function privateCache(directory) {
  const absolute = path.resolve(directory);
  let current = path.parse(absolute).root;
  for (const segment of absolute.slice(current.length).split('/').filter(Boolean)) {
    current = path.join(current, segment);
    let info;
    try { info = await lstat(current); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await mkdir(current, { mode: current === absolute ? 0o700 : 0o755 });
      info = await lstat(current);
    }
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('런타임 cache에는 symlink가 없는 실제 디렉터리가 필요합니다.');
  }
  if (await realpath(absolute) !== absolute) throw new Error('런타임 cache 경로가 실제 디렉터리와 다릅니다.');
  await chmod(absolute, 0o700);
}

async function cachedRuntime(spec, { cacheDirectory, download }) {
  const file = path.join(cacheDirectory, spec.cacheName);
  let handle;
  try { handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (handle) {
    try {
      const info = await handle.stat();
      if (!info.isFile() || info.size > spec.compressedLimit) throw new Error('런타임 cache에는 크기 상한 이하의 일반 파일이 필요합니다.');
      const bytes = await readBounded(handle, spec.compressedLimit);
      verifyRuntimeArchive(bytes, spec);
      return bytes;
    } finally { await handle.close(); }
  }
  const bytes = await download(spec.url, spec.compressedLimit);
  verifyRuntimeArchive(bytes, spec);
  try { await writeFile(file, bytes, { flag: 'wx', mode: 0o600 }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    return cachedRuntime(spec, { cacheDirectory, download });
  }
  return bytes;
}

export async function prepareMcpRuntimes({ cacheDirectory = defaultMcpOfflineCache, download = downloadBounded } = {}) {
  cacheDirectory = path.resolve(cacheDirectory);
  await privateCache(cacheDirectory);
  const result = {};
  for (const [name, spec] of Object.entries(MCP_OFFLINE_RUNTIMES)) result[name] = extractMcpRuntimeMember(await cachedRuntime(spec, { cacheDirectory, download }), spec.member, MCP_OFFLINE_LIMITS[name]);
  return result;
}

async function runCommand(command, args, options) {
  try { return (await execute(command, args, { ...options, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024, timeout: 10 * 60 * 1000 })).stdout; }
  catch (cause) {
    // package manager 출력에는 로컬 registry 자격 증명이 들어갈 수 있습니다.
    throw new Error(`오프라인 의존성 준비 명령에 실패했습니다: ${command} (code ${cause.code ?? 'unknown'})`);
  }
}

async function sourceFingerprints(directory) {
  const result = {};
  for (const name of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
    try {
      const info = await lstat(path.join(directory, name));
      if (!info.isFile() || info.isSymbolicLink() || info.size > 16 * 1024 * 1024) throw new Error(`원본 설정에는 크기 상한 이하의 일반 파일이 필요합니다: ${name}`);
      const handle = await open(path.join(directory, name), constants.O_RDONLY | constants.O_NOFOLLOW);
      try { result[name] = sha256(await readBounded(handle, 16 * 1024 * 1024)); }
      finally { await handle.close(); }
    } catch (error) { if (name !== 'pnpm-workspace.yaml' || error.code !== 'ENOENT') throw error; }
  }
  return result;
}

async function choosePnpm(run, options) {
  for (const candidate of [{ command: 'pnpm', prefix: [] }, { command: 'corepack', prefix: ['pnpm@12.15.0'] }]) {
    try {
      if ((await run(candidate.command, [...candidate.prefix, '--version'], { ...options, cwd: path.parse(path.resolve(options.cwd)).root, env: { ...options.env, COREPACK_ENABLE_NETWORK: '0', COREPACK_ENABLE_PROJECT_SPEC: '0', npm_config_manage_package_manager_versions: 'false' } })).trim() === '12.15.0') return candidate;
    } catch { /* 다음 로컬 후보를 검사합니다. */ }
  }
  throw new Error('로컬에서 pnpm 12.15.0을 실행할 수 없습니다. pnpm 또는 Corepack cache를 준비해 주세요.');
}

export async function prepareMcpOffline(bundle, { log = () => {}, run = runCommand, prepareRuntime = prepareMcpRuntimes, cacheDirectory = defaultMcpOfflineCache, download = downloadBounded } = {}) {
  const source = path.join(bundle.directory, 'app');
  const original = await sourceFingerprints(source);
  const stage = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-mcp-offline-')));
  const created = [];
  const names = ['runtime-node', 'runtime-pnpm', MCP_DEPENDENCIES_FILE, 'offline.json'];
  try {
    await chmod(stage, 0o700);
    for (const name of names) {
      try { await lstat(path.join(bundle.directory, name)); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      throw new Error(`오프라인 준비 파일이 이미 있습니다: ${name}`);
    }
    const app = path.join(stage, 'app');
    await cp(source, app, { recursive: true, force: false, errorOnExist: true, dereference: false });
    try { await lstat(path.join(app, 'node_modules')); throw new Error('고정 source에 node_modules를 포함할 수 없습니다.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const options = { cwd: app, env: { ...process.env, CI: 'true', COREPACK_ENABLE_NETWORK: '0' } };
    const pnpm = await choosePnpm(run, options);
    log('Linux x64 glibc용 production 의존성을 준비합니다.');
    await run(pnpm.command, [...pnpm.prefix, 'install', '--prod', '--frozen-lockfile', '--ignore-scripts', '--ignore-pnpmfile', '--no-runtime', '--os', 'linux', '--cpu', 'x64', '--libc', 'glibc', '--node-linker=hoisted', '--config.package-import-method=copy', '--config.manage-package-manager-versions=false', `--store-dir=${path.join(stage, 'store')}`], options);
    if (JSON.stringify(await sourceFingerprints(app)) !== JSON.stringify(original) || JSON.stringify(await sourceFingerprints(source)) !== JSON.stringify(original)) throw new Error('의존성 준비 중 원본 package·lock·workspace가 변경됐습니다.');
    const dependencies = await packMcpDependencies(path.join(app, 'node_modules'));
    log('공식 Node·pnpm Linux 런타임과 체크섬을 확인합니다.');
    const runtimes = await prepareRuntime({ cacheDirectory, download });
    const files = { ...runtimes, [MCP_DEPENDENCIES_FILE]: dependencies };
    if (Object.keys(files).length !== 3) throw new Error('오프라인 런타임 파일 목록이 다릅니다.');
    for (const name of ['runtime-node', 'runtime-pnpm']) {
      if (!Buffer.isBuffer(files[name]) || files[name].length > MCP_OFFLINE_LIMITS[name]) throw new Error('오프라인 런타임 크기 상한을 초과했습니다.');
      assertMcpLinuxExecutable(files[name]);
    }
    const manifest = validateMcpOfflineManifest({
      schemaVersion: 1, target: 'linux-x64-glibc', head: bundle.metadata.head, releaseId: bundle.metadata.releaseId,
      sourceSha256: bundle.metadata.files['app.tar.gz'].sha256, lockSha256: original['pnpm-lock.yaml'], packageSha256: original['package.json'],
      ...(original['pnpm-workspace.yaml'] ? { workspaceSha256: original['pnpm-workspace.yaml'] } : {}),
      nodeVersion: '24.22.1', pnpmVersion: '12.15.0', nodeLinker: 'hoisted',
      files: Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, fingerprint(bytes)])),
    });
    files['offline.json'] = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    for (const [name, bytes] of Object.entries(files)) {
      await writeFile(path.join(bundle.directory, name), bytes, { flag: 'wx', mode: 0o600 });
      created.push(name);
    }
    if (JSON.stringify(await sourceFingerprints(source)) !== JSON.stringify(original)) throw new Error('오프라인 준비 중 고정 source가 변경됐습니다.');
    return { manifest, transferFiles: Object.entries(files).map(([name, bytes]) => ({ name, ...fingerprint(bytes) })) };
  } catch (error) {
    await Promise.all(created.map((name) => rm(path.join(bundle.directory, name), { force: true })));
    throw error;
  } finally { await rm(stage, { recursive: true, force: true }); }
}
