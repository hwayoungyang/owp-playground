import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { releaseIndexSchema, knowledgeReleaseSchema } from '../src/features/releases/model/schema.ts';
import { collectArchiveFiles, readArchiveBytes } from './version-archive-files.ts';
import { createVersionPresentation, fileFingerprint, presentationEntrySchema, readVersionUiRuntime, versionPresentationEntry } from './version-presentation.ts';

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export async function projectVersionPresentation({ content, index }) {
  const runtime = await readVersionUiRuntime('/', (file) => readArchiveBytes(content, file));
  const entries = [];
  for (const release of index.releases) {
    const file = `versions/${release.releaseId}/index.html`;
    const raw = await readArchiveBytes(content, file);
    const entry = versionPresentationEntry(raw, release, runtime);
    const rawFile = path.join(content, entry.rawPath.slice(1));
    await mkdir(path.dirname(rawFile), { recursive: true });
    await writeFile(rawFile, raw, { flag: 'wx', mode: 0o644 });
    await writeFile(path.join(content, file), createVersionPresentation(raw, release, runtime));
    entries.push(entry);
  }
  await writeFile(path.join(content, 'version-ui/manifest.json'), `${JSON.stringify({ schemaVersion: 1, runtimeFingerprint: runtime.fingerprint, releases: entries }, null, 2)}\n`, { flag: 'wx', mode: 0o644 });
  return validateVersionPresentation(content);
}

export async function validateVersionPresentation(content) {
  const index = releaseIndexSchema.parse(JSON.parse((await readArchiveBytes(content, 'versions/index.json')).toString('utf8')));
  const runtime = await readVersionUiRuntime('/', (file) => readArchiveBytes(content, file));
  const manifest = JSON.parse((await readArchiveBytes(content, 'version-ui/manifest.json')).toString('utf8'));
  if (manifest.schemaVersion !== 1 || manifest.runtimeFingerprint !== runtime.fingerprint || !Array.isArray(manifest.releases) || manifest.releases.length !== index.releases.length) throw new Error('화면용 HTML manifest의 runtime 또는 릴리스 수가 다릅니다.');
  for (const release of index.releases) {
    const entry = presentationEntrySchema.parse(manifest.releases.find((entry) => entry.release?.releaseId === release.releaseId));
    const rawPath = `/version-ui/raw/${release.releaseId}/index.html`;
    if (entry.rawPath !== rawPath || !same(entry.release, release)) throw new Error('화면용 HTML의 원본 경로 또는 릴리스가 다릅니다.');
    const raw = await readArchiveBytes(content, rawPath.slice(1));
    if (!same(entry, versionPresentationEntry(raw, release, runtime))) throw new Error('원본 HTML 또는 화면용 HTML의 SHA가 다릅니다.');
    const directory = `versions/${release.releaseId}`;
    const manifestBytes = await readArchiveBytes(content, `${directory}/knowledge-release.json`);
    if (fileFingerprint(manifestBytes).sha256 !== release.manifestSha256) throw new Error('원본 release manifest SHA가 다릅니다.');
    const archived = knowledgeReleaseSchema.parse(JSON.parse(manifestBytes.toString('utf8')));
    if (archived.releaseId !== release.releaseId || !same(archived.packages, release.packages)) throw new Error('원본 release manifest의 릴리스 또는 패키지가 다릅니다.');
    const actual = await collectArchiveFiles(path.join(content, directory));
    const expected = [...Object.keys(archived.files), 'knowledge-release.json'].sort();
    if (!same(Object.keys(actual).sort(), expected)) throw new Error('화면용 릴리스의 파일 목록이 원본 manifest와 다릅니다.');
    for (const [file, expected] of Object.entries(archived.files)) {
      const bytes = file === 'index.html' ? raw : await readArchiveBytes(content, `${directory}/${file}`);
      if (!same(fileFingerprint(bytes), expected)) throw new Error(`원본 archive 파일 SHA가 다릅니다: ${release.releaseId}/${file}`);
    }
    const projected = await readArchiveBytes(content, `${directory}/index.html`);
    if (!projected.equals(createVersionPresentation(raw, release, runtime))) throw new Error('화면용 HTML이 원본과 현재 버전 메뉴로 생성한 결과와 다릅니다.');
  }
  return index;
}
