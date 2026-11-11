import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { relativeDistributionPathSchema } from '../../src/distribution/content.ts';
import { DistributionError, objectDigest, sha256 } from './integrity.ts';

export type FileIdentity = { readonly path: string; readonly bytes: number; readonly sha256: string };
export function overlaps(left: string, right: string): boolean {
  const a = resolve(left); const b = resolve(right);
  return a === b || a.startsWith(`${b}${sep}`) || b.startsWith(`${a}${sep}`);
}

/** 명시된 root 내부의 모든 경로 segment를 검사하고 symlink를 거부합니다. */
export function safePath(root: string, file: string): string {
  const path = relativeDistributionPathSchema.parse(file);
  const absoluteRoot = resolve(root);
  let current: string = sep;
  for (const segment of absoluteRoot.split(sep).filter(Boolean)) {
    // root 자체가 symlink를 통과하는 경우도 거부합니다.
    current = resolve(current, segment);
    if (lstatSync(current).isSymbolicLink())
      throw new DistributionError('symlink-forbidden', '심볼릭 링크는 사용할 수 없습니다.');
  }
  current = absoluteRoot;
  for (const segment of path.split('/')) {
    current = resolve(current, segment);
    if (lstatSync(current).isSymbolicLink())
      throw new DistributionError('symlink-forbidden', '심볼릭 링크는 사용할 수 없습니다.');
  }
  if (isAbsolute(relative(realpathSync(absoluteRoot), realpathSync(current))) ||
    relative(absoluteRoot, current).startsWith(`..${sep}`))
    throw new DistributionError('path-escape', '허용된 root를 벗어났습니다.');
  return current;
}

export function readSafeFile(root: string, file: string): Buffer {
  const full = safePath(root, file);
  if (!lstatSync(full).isFile()) throw new DistributionError('file-required', '일반 파일이 필요합니다.');
  return readFileSync(full);
}

export function fileIdentity(root: string, file: string): FileIdentity {
  const bytes = readSafeFile(root, file);
  return { path: file, bytes: bytes.length, sha256: sha256(bytes) };
}

/** 패키지 검증용 전수 inventory입니다. 자료 복사 목록을 확장하는 데 사용하지 않습니다. */
export function inventoryPackage(root: string): readonly FileIdentity[] {
  const files: FileIdentity[] = [];
  function visit(directory: string) {
    for (const name of readdirSync(directory).sort()) {
      const full = resolve(directory, name);
      const file = relative(root, full).split(sep).join('/');
      const checked = safePath(root, file);
      const stat = lstatSync(checked);
      if (stat.isDirectory()) visit(checked);
      else if (stat.isFile()) files.push(fileIdentity(root, file));
      else throw new DistributionError('special-file-forbidden', '일반 파일과 디렉터리만 허용합니다.');
    }
  }
  visit(root);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export function fileInventoryDigest(files: readonly FileIdentity[]): string {
  return objectDigest([...files].sort((a, b) => a.path.localeCompare(b.path)));
}

/** Framework hashFiles + objectDigest 계약이며 bytes 필드는 digest에 포함하지 않습니다. */
export function packageArtifactDigest(files: readonly FileIdentity[]): string {
  return objectDigest(Object.fromEntries(files.map((file) => [file.path, file.sha256])));
}

/** 설정에서 명시한 원본 디렉터리 '.'만 root 자체를 가리킬 수 있습니다. */
export function safeDirectory(root: string, directory: string): string {
  const target = directory === '.' ? resolve(root) : safePath(root, directory);
  // root 자체와 그 부모의 symlink도 safePath의 같은 검사로 확인합니다.
  safePath(dirname(target), relative(dirname(target), target));
  if (!lstatSync(target).isDirectory())
    throw new DistributionError('directory-required', '실제 디렉터리가 필요합니다.');
  return target;
}

export function assertNewOutput(root: string, output: string, protectedRoots: readonly string[]): void {
  const target = resolve(output);
  if (protectedRoots.some((source) => overlaps(source, target)) || overlaps(root, target))
    throw new DistributionError('output-overlap', '출력은 원본·runtime·전체 archive와 분리해야 합니다.');
  // output 부모는 실제 디렉터리여야 하며 기존 symlink 경유를 허용하지 않습니다.
  safeDirectory(dirname(target), '.');
  try {
    lstatSync(target);
    throw new DistributionError('output-exists', '출력 경로가 이미 존재합니다.');
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
}
