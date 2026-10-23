import { createHash } from 'node:crypto';
import { readArchivedFile } from '../scripts/version-archive.ts';
import { KnowledgeError, type KnowledgeArchive } from './knowledge-archive.ts';
import { exampleInput } from './schema.ts';

export async function getArchivedExample(archive: KnowledgeArchive, raw: unknown) {
  const { dataset, sources, sourceUrl } = archive;
  const input = exampleInput.parse(raw);
  const { entry, release, packageId, meta } = await dataset(input);
  const manifest = await sources(release, packageId ?? '');
  const sample = manifest.samples.find((sample) => sample.id === input.exampleId);
  if (!sample) throw new KnowledgeError('EXAMPLE_NOT_FOUND', '등록된 예제가 없습니다.');
  const requested = input.file ?? sample.entrypoint;
  if (!sample.files.some((file) => file.path === requested))
    throw new KnowledgeError(
      'FILE_NOT_ALLOWED',
      '이 예제의 manifest에 등록된 파일만 읽을 수 있습니다.',
    );
  const candidates = input.includeDependencies
    ? [requested, ...sample.files.map((file) => file.path).filter((file) => file !== requested)]
    : [requested];
  let budget = input.maxChars;
  const files = [];
  let nextOffset: number | null = null;
  for (const [index, file] of candidates
    .slice(input.offset, input.offset + input.limit)
    .entries()) {
    if (budget <= 0) {
      nextOffset = input.offset + index;
      break;
    }
    const record = sample.files.find((entry) => entry.path === file);
    if (!record) throw new KnowledgeError('FILE_NOT_ALLOWED', 'manifest 파일이 없습니다.');
    const archivedPath = file.startsWith(entry.basePath)
      ? file.slice(entry.basePath.length)
      : file.replace(/^\//, '');
    const bytes = await readArchivedFile(release, archivedPath);
    if (createHash('sha256').update(bytes).digest('hex') !== record.sha256)
      throw new KnowledgeError('INTEGRITY_MISMATCH', '예제 source hash가 일치하지 않습니다.');
    const lines = bytes.toString('utf8').split('\n');
    const startLine = file === requested ? input.startLine : 1;
    const remaining = lines.slice(startLine - 1);
    const picked: string[] = [];
    let chars = 0;
    for (const line of remaining) {
      const needed = line.length + (picked.length ? 1 : 0);
      if (chars + needed > budget) break;
      picked.push(line);
      chars += needed;
    }
    if (picked.length === 0 && remaining.length > 0) {
      if (files.length > 0) {
        nextOffset = input.offset + index;
        break;
      }
      throw new KnowledgeError(
        'LINE_TOO_LARGE',
        '한 줄이 응답 한도를 넘습니다. maxChars를 늘려 다시 조회하세요.',
      );
    }
    budget -= chars;
    const truncated = picked.length < remaining.length;
    files.push({
      path: file,
      sha256: record.sha256,
      sourceUrl: sourceUrl(entry.releaseId, file),
      content: picked.join('\n'),
      startLine,
      nextLine: truncated ? startLine + picked.length : null,
      truncated,
    });
    if (truncated) {
      nextOffset = input.offset + index;
      break;
    }
  }
  if (nextOffset === null && input.offset + files.length < candidates.length)
    nextOffset = input.offset + files.length;
  return {
    ...meta,
    sourceUrls: [
      ...meta.sourceUrls,
      sourceUrl(entry.releaseId, `/catalogs/${packageId}.sources.json`),
    ],
    id: sample.id,
    title: sample.title,
    entrypoint: sample.entrypoint,
    dependencyVersions: manifest.dependencyVersions,
    externalImports: sample.externalImports,
    manifest: sample.files,
    files,
    total: candidates.length,
    nextOffset,
  };
}
