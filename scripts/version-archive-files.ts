import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, readdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { archiveRelativePathSchema, type ReleaseFile } from '../src/features/releases/model/schema.ts';

export type VersionArchiveErrorCode =
  | 'ARCHIVE_NOT_FOUND' | 'INVALID_DATA' | 'UNSAFE_PATH' | 'INTEGRITY_MISMATCH'
  | 'RELEASE_NOT_FOUND' | 'PACKAGE_NOT_FOUND' | 'VERSION_MISMATCH' | 'ARCHIVE_LOCKED'
  | 'RELEASE_EXISTS' | 'BUILD_CONTEXT_CHANGED' | 'STABLE_REQUIRES_CLEAN_TREE' | 'BUILD_FAILED';

export class VersionArchiveError extends Error {
  readonly code: VersionArchiveErrorCode;
  constructor(code: VersionArchiveErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'VersionArchiveError';
    this.code = code;
  }
}

const filesystemErrorSchema = z.object({ code: z.string() });
export function filesystemErrorCode(error: unknown): string | undefined {
  const result = filesystemErrorSchema.safeParse(error);
  return result.success ? result.data.code : undefined;
}

export function parseArchiveData<T>(schema: z.ZodType<T>, input: unknown, label: string): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new VersionArchiveError('INVALID_DATA', `${label} 형식이 올바르지 않습니다.`, { cause: result.error });
  }
  return result.data;
}

export function parseArchiveJson<T>(schema: z.ZodType<T>, content: Buffer, label: string): T {
  try {
    return parseArchiveData(schema, JSON.parse(content.toString('utf8')), label);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new VersionArchiveError('INVALID_DATA', `${label} JSON을 읽을 수 없습니다.`, { cause: error });
    }
    throw error;
  }
}

export async function assertArchiveDirectory(directory: string): Promise<string> {
  const root = path.resolve(directory);
  let current = path.parse(root).root;
  for (const segment of root.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const info = await lstat(current);
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new VersionArchiveError('UNSAFE_PATH', `symlink가 아닌 디렉터리가 필요합니다: ${current}`);
    }
  }
  return root;
}

export async function ensureArchiveDirectory(directory: string): Promise<string> {
  const root = path.resolve(directory);
  let current = path.parse(root).root;
  for (const segment of root.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try { await mkdir(current); }
    catch (error) { if (filesystemErrorCode(error) !== 'EEXIST') throw error; }
    const info = await lstat(current);
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new VersionArchiveError('UNSAFE_PATH', `symlink가 아닌 디렉터리가 필요합니다: ${current}`);
    }
  }
  return root;
}

export function safeArchivePath(directory: string, relativePath: string): string {
  const parsed = archiveRelativePathSchema.safeParse(relativePath);
  if (!parsed.success) throw new VersionArchiveError('UNSAFE_PATH', `안전하지 않은 아카이브 경로입니다: ${relativePath}`);
  return path.join(directory, parsed.data);
}

export async function readArchiveBytes(directory: string, relativePath: string): Promise<Buffer> {
  const file = safeArchivePath(directory, relativePath);
  await assertArchiveDirectory(path.dirname(file));
  const info = await lstat(file);
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new VersionArchiveError('UNSAFE_PATH', `일반 파일이 필요합니다: ${relativePath}`);
  }
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (!(await handle.stat()).isFile()) throw new VersionArchiveError('UNSAFE_PATH', `일반 파일이 필요합니다: ${relativePath}`);
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

export function archiveFileFingerprint(bytes: Buffer): ReleaseFile {
  return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export async function collectArchiveFiles(directory: string): Promise<Readonly<Record<string, ReleaseFile>>> {
  const root = await assertArchiveDirectory(directory);
  const files: Record<string, ReleaseFile> = Object.create(null);
  async function visit(prefix: string): Promise<void> {
    for (const name of (await readdir(path.join(root, prefix))).sort()) {
      const relative = prefix ? `${prefix}/${name}` : name;
      const file = safeArchivePath(root, relative);
      const info = await lstat(file);
      if (info.isSymbolicLink()) throw new VersionArchiveError('UNSAFE_PATH', `symlink를 거부했습니다: ${relative}`);
      if (info.isDirectory()) await visit(relative);
      else files[relative] = archiveFileFingerprint(await readArchiveBytes(root, relative));
    }
  }
  await visit('');
  return files;
}

export function verifyArchiveFingerprint(content: Buffer, expected: ReleaseFile, label: string): void {
  const actual = archiveFileFingerprint(content);
  if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
    throw new VersionArchiveError('INTEGRITY_MISMATCH', `파일 크기 또는 SHA-256이 다릅니다: ${label}`);
  }
}
