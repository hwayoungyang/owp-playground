import { createHash } from 'node:crypto';
import { chmod, lstat, mkdir, open, readdir, readlink, rm, symlink, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';

export const MCP_DEPENDENCIES_FILE = 'dependencies.bin.gz';
export const MCP_OFFLINE_LIMITS = Object.freeze({
  'runtime-node': 128 * 1024 * 1024,
  'runtime-pnpm': 256 * 1024 * 1024,
  'dependencies.bin.gz': 512 * 1024 * 1024,
  'offline.json': 64 * 1024,
  expandedDependencies: 1024 * 1024 * 1024,
  dependencyFile: 256 * 1024 * 1024,
  dependencyManifest: 16 * 1024 * 1024,
  entries: 100000,
  linkDepth: 128,
});
const magic = Buffer.from('OWPMCPDEPS1\n');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hashPattern = /^[0-9a-f]{64}$/;
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, allowed, required = allowed) => object(value) && Object.keys(value).every((key) => allowed.includes(key)) && required.every((key) => Object.hasOwn(value, key));
const boundedInteger = (value, max, minimum = 0) => Number.isSafeInteger(value) && value >= minimum && value <= max;
const safePath = (value) => typeof value === 'string' && Buffer.byteLength(value) <= 4096 && !/[\u0000-\u001f\u007f\\]/.test(value) && !value.startsWith('/') && value.split('/').every((part) => part && part !== '.' && part !== '..');
const metadataNames = new Set(['.npmrc', '.pnpmrc', '.yarnrc', '.yarnrc.yml', '.modules.yaml', '.pnpm-workspace-state-v1.json', '.package-lock.json']);
const excluded = (name) => name.split('/').some((part) => metadataNames.has(part) || part.startsWith('.pnpm-workspace-state-')) || name === '.pnpm' || name.startsWith('.pnpm/');

async function readBounded(handle, maximum) {
  const chunks = [];
  let total = 0;
  while (total <= maximum) {
    const chunk = Buffer.alloc(Math.min(64 * 1024, maximum + 1 - total));
    const { bytesRead } = await handle.read(chunk, 0, chunk.length, null);
    if (!bytesRead) break;
    total += bytesRead;
    if (total > maximum) throw new Error('의존성 파일이 준비 중 크기 상한을 초과했습니다.');
    chunks.push(chunk.subarray(0, bytesRead));
  }
  return Buffer.concat(chunks, total);
}

export function validateMcpOfflineManifest(value, expected = {}) {
  const required = ['schemaVersion', 'target', 'head', 'releaseId', 'sourceSha256', 'lockSha256', 'packageSha256', 'nodeVersion', 'pnpmVersion', 'nodeLinker', 'files'];
  if (!exactKeys(value, [...required, 'workspaceSha256'], required) || value.schemaVersion !== 1 || value.target !== 'linux-x64-glibc' ||
      typeof value.head !== 'string' || !/^[0-9a-f]{40}$/.test(value.head) || typeof value.releaseId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value.releaseId) ||
      value.nodeVersion !== '24.22.1' || value.pnpmVersion !== '12.15.0' || value.nodeLinker !== 'hoisted') throw new Error('오프라인 manifest의 대상·버전·구조가 올바르지 않습니다.');
  for (const name of ['sourceSha256', 'lockSha256', 'packageSha256', ...(Object.hasOwn(value, 'workspaceSha256') ? ['workspaceSha256'] : [])]) {
    if (typeof value[name] !== 'string' || !hashPattern.test(value[name])) throw new Error(`오프라인 manifest SHA-256이 올바르지 않습니다: ${name}`);
  }
  const names = ['runtime-node', 'runtime-pnpm', MCP_DEPENDENCIES_FILE];
  if (!exactKeys(value.files, names)) throw new Error('오프라인 manifest 파일 목록이 올바르지 않습니다.');
  for (const name of names) {
    const file = value.files[name];
    if (!exactKeys(file, ['bytes', 'sha256']) || !boundedInteger(file.bytes, MCP_OFFLINE_LIMITS[name], 1) || typeof file.sha256 !== 'string' || !hashPattern.test(file.sha256)) throw new Error(`오프라인 파일 크기 또는 SHA-256이 올바르지 않습니다: ${name}`);
  }
  for (const name of ['head', 'releaseId', 'sourceSha256', 'lockSha256', 'packageSha256', 'workspaceSha256']) {
    if (Object.hasOwn(expected, name) && value[name] !== expected[name]) throw new Error(`오프라인 manifest와 원본 묶음이 다릅니다: ${name}`);
  }
  return value;
}

function validateEntries(entries) {
  if (!Array.isArray(entries) || !entries.length || entries.length > MCP_OFFLINE_LIMITS.entries) throw new Error('의존성 항목 수 상한을 초과했거나 항목이 없습니다.');
  const names = new Map();
  let total = 0;
  for (const entry of entries) {
    if (!object(entry) || !safePath(entry.path) || excluded(entry.path) || names.has(entry.path)) throw new Error('의존성 경로·메타데이터·중복 항목을 거부했습니다.');
    if (entry.type === 'directory') {
      if (!exactKeys(entry, ['path', 'type', 'mode']) || entry.mode !== 0o755) throw new Error('의존성 디렉터리 권한이 올바르지 않습니다.');
    } else if (entry.type === 'file') {
      if (!exactKeys(entry, ['path', 'type', 'mode', 'bytes', 'sha256']) || ![0o644, 0o755].includes(entry.mode) || !boundedInteger(entry.bytes, MCP_OFFLINE_LIMITS.dependencyFile) || typeof entry.sha256 !== 'string' || !hashPattern.test(entry.sha256)) throw new Error('의존성 일반 파일이 올바르지 않습니다.');
      total += entry.bytes;
      if (total > MCP_OFFLINE_LIMITS.expandedDependencies) throw new Error('의존성 전체 크기 상한을 초과했습니다.');
    } else if (entry.type === 'symlink') {
      if (!exactKeys(entry, ['path', 'type', 'target']) || typeof entry.target !== 'string' || !entry.target || Buffer.byteLength(entry.target) > 4096 || /[\u0000-\u001f\u007f\\]/.test(entry.target) || path.posix.isAbsolute(entry.target)) throw new Error('의존성 symlink는 내부 상대 경로만 허용합니다.');
    } else throw new Error('의존성 특수 파일을 거부했습니다.');
    names.set(entry.path, entry);
  }
  for (const entry of entries) {
    const parts = entry.path.split('/');
    while (parts.length > 1) {
      parts.pop();
      if (names.get(parts.join('/'))?.type !== 'directory') throw new Error('의존성 상위 경로가 없거나 일반 파일·symlink와 충돌합니다.');
    }
  }
  // 모든 링크를 따라가며 순환·이탈·끊어진 링크를 거부합니다.
  for (const entry of entries.filter((candidate) => candidate.type === 'symlink')) {
    let pending = [...path.posix.dirname(entry.path).split('/'), ...entry.target.split('/')];
    let current = [];
    const followed = new Set([entry.path]);
    while (pending.length) {
      const segment = pending.shift();
      if (segment === '' || segment === '.') continue;
      if (segment === '..') {
        if (!current.length) throw new Error('의존성 symlink가 루트 밖을 가리킵니다.');
        current.pop();
        continue;
      }
      const name = [...current, segment].join('/');
      const target = names.get(name);
      if (!target) throw new Error('의존성 symlink 대상이 없습니다.');
      if (target.type === 'symlink') {
        if (followed.has(name)) throw new Error('의존성 symlink 순환을 거부했습니다.');
        if (followed.size >= MCP_OFFLINE_LIMITS.linkDepth) throw new Error('의존성 symlink 깊이 상한을 초과했습니다.');
        followed.add(name);
        pending = [...path.posix.dirname(name).split('/'), ...target.target.split('/'), ...pending];
        current = [];
      } else {
        if (pending.length && target.type !== 'directory') throw new Error('의존성 symlink 대상 경로가 디렉터리가 아닙니다.');
        current.push(segment);
      }
    }
  }
  return total;
}

export async function packMcpDependencies(directory) {
  const root = await lstat(directory);
  if (!root.isDirectory() || root.isSymbolicLink()) throw new Error('의존성 루트에는 실제 디렉터리가 필요합니다.');
  const entries = [];
  const blobs = [];
  let total = 0;
  async function visit(prefix = '') {
    for (const name of (await readdir(path.join(directory, prefix))).sort()) {
      const relative = prefix ? `${prefix}/${name}` : name;
      if (excluded(relative)) continue;
      if (!safePath(relative) || entries.length >= MCP_OFFLINE_LIMITS.entries) throw new Error('의존성 경로 또는 항목 수 상한을 초과했습니다.');
      const file = path.join(directory, relative);
      const info = await lstat(file);
      if (info.isSymbolicLink()) entries.push({ path: relative, type: 'symlink', target: await readlink(file) });
      else if (info.isDirectory()) {
        entries.push({ path: relative, type: 'directory', mode: 0o755 });
        await visit(relative);
      } else if (info.isFile()) {
        if (info.size > MCP_OFFLINE_LIMITS.dependencyFile || total + info.size > MCP_OFFLINE_LIMITS.expandedDependencies) throw new Error('의존성 파일 크기 상한을 초과했습니다.');
        const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
        let content;
        try {
          const actual = await handle.stat();
          if (!actual.isFile() || actual.size !== info.size || actual.size > MCP_OFFLINE_LIMITS.dependencyFile) throw new Error('의존성 파일이 준비 중 변경됐습니다.');
          content = await readBounded(handle, info.size);
          if (content.length !== info.size) throw new Error('의존성 파일 크기가 준비 중 변경됐습니다.');
        } finally { await handle.close(); }
        total += content.length;
        entries.push({ path: relative, type: 'file', mode: info.mode & 0o111 ? 0o755 : 0o644, bytes: content.length, sha256: digest(content) });
        blobs.push(content);
      } else throw new Error(`의존성 특수 파일을 거부했습니다: ${relative}`);
    }
  }
  await visit();
  validateEntries(entries);
  const header = Buffer.from(JSON.stringify({ schemaVersion: 1, entries }));
  if (header.length > MCP_OFFLINE_LIMITS.dependencyManifest) throw new Error('의존성 manifest 크기 상한을 초과했습니다.');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(header.length);
  const bytes = gzipSync(Buffer.concat([magic, length, header, ...blobs]), { level: 6 });
  if (bytes.length > MCP_OFFLINE_LIMITS[MCP_DEPENDENCIES_FILE]) throw new Error('압축 의존성 크기 상한을 초과했습니다.');
  return bytes;
}

export function inspectMcpDependencies(compressed, manifest) {
  if (!Buffer.isBuffer(compressed) || compressed.length > MCP_OFFLINE_LIMITS[MCP_DEPENDENCIES_FILE]) throw new Error('압축 의존성 크기 상한을 초과했습니다.');
  if (manifest) {
    const expected = validateMcpOfflineManifest(manifest).files[MCP_DEPENDENCIES_FILE];
    if (compressed.length !== expected.bytes || digest(compressed) !== expected.sha256) throw new Error('의존성 artifact 크기 또는 SHA-256이 다릅니다.');
  }
  const bytes = gunzipSync(compressed, { maxOutputLength: MCP_OFFLINE_LIMITS.expandedDependencies + MCP_OFFLINE_LIMITS.dependencyManifest + magic.length + 4 });
  if (!bytes.subarray(0, magic.length).equals(magic) || bytes.length < magic.length + 4) throw new Error('의존성 artifact 형식이 올바르지 않습니다.');
  const length = bytes.readUInt32BE(magic.length);
  const start = magic.length + 4;
  if (length > MCP_OFFLINE_LIMITS.dependencyManifest || start + length > bytes.length) throw new Error('의존성 manifest 크기 상한을 초과했습니다.');
  const header = JSON.parse(bytes.subarray(start, start + length).toString('utf8'));
  if (!exactKeys(header, ['schemaVersion', 'entries']) || header.schemaVersion !== 1) throw new Error('의존성 manifest 형식이 올바르지 않습니다.');
  const total = validateEntries(header.entries);
  let offset = start + length;
  const entries = header.entries.map((entry) => {
    if (entry.type !== 'file') return entry;
    const content = bytes.subarray(offset, offset + entry.bytes);
    offset += entry.bytes;
    if (content.length !== entry.bytes || digest(content) !== entry.sha256) throw new Error(`의존성 파일 SHA-256이 다릅니다: ${entry.path}`);
    return { ...entry, content };
  });
  if (offset !== bytes.length) throw new Error('의존성 artifact에 남거나 부족한 바이트가 있습니다.');
  return { entries, bytes: total };
}

export async function extractMcpDependencies(bytes, directory, manifest) {
  const inspected = inspectMcpDependencies(bytes, manifest);
  directory = path.resolve(directory);
  let ancestor = path.parse(directory).root;
  for (const segment of path.dirname(directory).slice(ancestor.length).split('/').filter(Boolean)) {
    ancestor = path.join(ancestor, segment);
    const info = await lstat(ancestor);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('의존성 추출 경로의 상위에는 실제 디렉터리가 필요합니다.');
  }
  await mkdir(directory, { mode: 0o755 });
  try {
    await chmod(directory, 0o755);
    for (const entry of inspected.entries.filter((entry) => entry.type === 'directory').sort((left, right) => left.path.split('/').length - right.path.split('/').length)) {
      await mkdir(path.join(directory, entry.path), { mode: 0o755 });
      await chmod(path.join(directory, entry.path), 0o755);
    }
    for (const entry of inspected.entries.filter((entry) => entry.type === 'file')) {
      const destination = path.join(directory, entry.path);
      await writeFile(destination, entry.content, { flag: 'wx', mode: entry.mode });
      await chmod(destination, entry.mode);
    }
    for (const entry of inspected.entries.filter((entry) => entry.type === 'symlink')) await symlink(entry.target, path.join(directory, entry.path));
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
  return { entries: inspected.entries.length, bytes: inspected.bytes };
}
