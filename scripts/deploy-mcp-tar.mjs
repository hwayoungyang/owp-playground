import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const limit = 512 * 1024 * 1024;
const field = (block, start, length) => block.subarray(start, start + length).toString('utf8').replace(/\0.*$/s, '');
const safePath = (name) => /^[A-Za-z0-9_./@+-]+$/.test(name) && !name.startsWith('/') && name.split('/').every((part) => part && part !== '.' && part !== '..');

function paxRecords(content) {
  const records = {};
  let offset = 0;
  while (offset < content.length) {
    const space = content.indexOf(32, offset);
    const length = Number(content.subarray(offset, space).toString());
    if (space < offset || !Number.isSafeInteger(length) || length <= space - offset + 2 || offset + length > content.length) throw new Error('tar PAX 길이가 올바르지 않습니다.');
    const record = content.subarray(space + 1, offset + length).toString('utf8');
    const equals = record.indexOf('=');
    if (equals < 1 || !record.endsWith('\n')) throw new Error('tar PAX record가 올바르지 않습니다.');
    const key = record.slice(0, equals);
    if (Object.hasOwn(records, key) || !['comment', 'mtime', 'atime', 'ctime', 'LIBARCHIVE.xattr.com.apple.provenance', 'SCHILY.xattr.com.apple.provenance'].includes(key)) throw new Error('지원하지 않는 tar PAX 속성입니다.');
    records[key] = record.slice(equals + 1, -1);
    offset += length;
  }
  return records;
}

export function inspectMcpTar(compressed) {
  const bytes = gunzipSync(compressed, { maxOutputLength: limit });
  const entries = [];
  const names = new Map();
  let offset = 0;
  let comment;
  let ended = false;
  while (offset + 512 <= bytes.length) {
    const block = bytes.subarray(offset, offset + 512);
    if (block.every((value) => value === 0)) {
      if (offset + 1024 > bytes.length || !bytes.subarray(offset).every((value) => value === 0)) throw new Error('tar 종료 블록이 올바르지 않습니다.');
      ended = true;
      break;
    }
    const checksum = [...block].reduce((sum, value, index) => sum + (index >= 148 && index < 156 ? 32 : value), 0);
    if (Number.parseInt(field(block, 148, 8).trim(), 8) !== checksum) throw new Error('tar header checksum이 다릅니다.');
    const sizeField = field(block, 124, 12).trim();
    if (!/^[0-7]+$/.test(sizeField)) throw new Error('tar 파일 크기가 올바르지 않습니다.');
    const size = Number.parseInt(sizeField, 8);
    const type = field(block, 156, 1) || '0';
    offset += 512;
    if (size > limit || offset + size > bytes.length) throw new Error('tar 파일 크기 상한을 초과했습니다.');
    const content = bytes.subarray(offset, offset + size);
    offset += Math.ceil(size / 512) * 512;
    if (type === 'g' || type === 'x') {
      const records = paxRecords(content);
      if (records.comment) {
        if (comment !== undefined && comment !== records.comment) throw new Error('tar commit comment가 중복됩니다.');
        comment = records.comment;
      }
      continue;
    }
    if (type !== '0' && type !== '5') throw new Error('tar 링크 또는 특수 파일을 거부했습니다.');
    let name = [field(block, 345, 155), field(block, 0, 100)].filter(Boolean).join('/');
    if (name === '.' || name === './') name = '';
    else name = name.replace(/^\.\//, '').replace(/\/$/, '');
    if (name === '' && type === '5') {
      if (names.has('')) throw new Error('tar 중복 경로입니다.');
      names.set('', type);
      continue;
    }
    if (!safePath(name) || names.has(name)) throw new Error(`tar 경로 이탈·공백·제어 문자·중복 경로를 거부했습니다: ${JSON.stringify(name)}`);
    if (type === '5' && size !== 0) throw new Error('tar 디렉터리에 파일 내용이 있습니다.');
    names.set(name, type);
    entries.push({ name, directory: type === '5', content });
    if (entries.length > 50000) throw new Error('tar 항목 수 상한을 초과했습니다.');
  }
  if (!ended || entries.length === 0) throw new Error('tar가 비었거나 종료 블록이 없습니다.');
  for (const { name } of entries) {
    const parts = name.split('/');
    while (parts.length > 1) {
      parts.pop();
      if (names.has(parts.join('/')) && names.get(parts.join('/')) !== '5') throw new Error('tar 파일과 디렉터리 경로가 충돌합니다.');
    }
  }
  const contentEntries = entries.filter((entry) => {
    const basename = path.posix.basename(entry.name);
    if (!basename.startsWith('._')) return true;
    const sibling = path.posix.join(path.posix.dirname(entry.name), basename.slice(2));
    if (entry.directory || entry.content.length < 26 || entry.content.length > 65536 || entry.content.readUInt32BE(0) !== 0x00051607 || entry.content.readUInt32BE(4) !== 0x00020000 || !names.has(sibling)) throw new Error('tar AppleDouble 메타데이터가 올바르지 않습니다.');
    return false;
  });
  return { entries: contentEntries, comment, expandedBytes: bytes.length };
}

export async function extractMcpTar(inspected, directory) {
  await mkdir(directory, { mode: 0o700 });
  for (const entry of inspected.entries) {
    const destination = path.join(directory, entry.name);
    await mkdir(entry.directory ? destination : path.dirname(destination), { recursive: true, mode: 0o755 });
    if (!entry.directory) await writeFile(destination, entry.content, { flag: 'wx', mode: 0o644 });
  }
}
