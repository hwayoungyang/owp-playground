import { lstatSync, readdirSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { readSafeFile, safePath } from '../../scripts/distribution/files.ts';
import type { FileIdentity } from '../../scripts/distribution/files.ts';
import { DistributionError, sha256 } from '../../scripts/distribution/integrity.ts';

export type CompanySnapshot = {
  readonly root: string;
  readonly files: readonly FileIdentity[];
  readonly read: (file: string) => Buffer;
};

/** 각 일반 파일을 한 번만 읽고 그 bytes에서 inventory와 후속 파싱을 만듭니다. */
export function snapshotCompanyFiles(root: string): CompanySnapshot {
  const bytes = new Map<string, Buffer>();
  const files: FileIdentity[] = [];
  function visit(directory: string): void {
    for (const name of readdirSync(directory).sort()) {
      const file = relative(root, resolve(directory, name)).split(sep).join('/');
      const checked = safePath(root, file);
      const stat = lstatSync(checked);
      if (stat.isDirectory()) visit(checked);
      else if (stat.isFile()) {
        const content = readSafeFile(root, file);
        bytes.set(file, content);
        files.push({ path: file, bytes: content.length, sha256: sha256(content) });
      } else
        throw new DistributionError('special-file-forbidden', '일반 파일과 디렉터리만 허용합니다.');
    }
  }
  visit(root);
  return {
    root,
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    read(file) {
      const content = bytes.get(file);
      if (!content)
        throw new DistributionError(
          'company-file-excluded',
          '고정된 포함 파일만 읽을 수 있습니다.',
        );
      return Buffer.from(content);
    },
  };
}
