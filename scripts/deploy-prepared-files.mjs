import { constants } from 'node:fs';
import { chmod, lstat, mkdtemp, open, rename } from 'node:fs/promises';
import path from 'node:path';
import { assertArchiveDirectory, ensureArchiveDirectory, filesystemErrorCode } from './version-archive-files.ts';

export async function readPreparedBytes(directory, name, limit) {
  await assertArchiveDirectory(directory);
  if (!/^[A-Za-z0-9._-]+$/.test(name)) throw new Error('준비 파일 이름이 올바르지 않습니다.');
  const handle = await open(path.join(directory, name), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > limit) throw new Error(`준비 파일의 종류 또는 크기가 올바르지 않습니다: ${name}`);
    const chunks = [];
    let length = 0;
    while (length <= limit) {
      const bytes = Buffer.alloc(Math.min(65536, limit + 1 - length));
      const result = await handle.read(bytes);
      if (!result.bytesRead) break;
      length += result.bytesRead;
      if (length > limit) throw new Error(`준비 파일의 크기 상한을 초과했습니다: ${name}`);
      chunks.push(bytes.subarray(0, result.bytesRead));
    }
    if (length !== info.size) throw new Error(`읽는 중 준비 파일이 변경됐습니다: ${name}`);
    return Buffer.concat(chunks, length);
  } finally { await handle.close(); }
}

export async function preparedDirectoryExists(directory) {
  try { await lstat(directory); }
  catch (error) {
    if (filesystemErrorCode(error) === 'ENOENT') return false;
    throw error;
  }
  await assertArchiveDirectory(directory);
  return true;
}

export async function createPreparedStage(root) {
  await ensureArchiveDirectory(root);
  const stage = await mkdtemp(path.join(root, '.prepare-'));
  await chmod(stage, 0o700);
  return stage;
}

export async function publishPreparedStage(stage, destination) {
  await assertArchiveDirectory(path.dirname(destination));
  if (await preparedDirectoryExists(destination)) throw new Error('같은 배포 준비 자료가 이미 있습니다. 기존 자료를 보존했습니다.');
  await rename(stage, destination);
}
