import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const fingerprint = (content) => createHash('sha256').update(content).digest('hex');
export const metadata = (releaseId = '20261023-120000-0123456789ab', overrides = {}) => ({
  releaseId, createdAt: '2026-10-23T03:00:00.000Z', appVersion: '0.1.0',
  commit: '0123456789ab', dirty: true, channel: 'draft', basePath: `/versions/${releaseId}/`, ...overrides,
});

export async function archiveFixture(t) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'owp-version-archive-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  return { root, archiveRoot: path.join(root, 'archive') };
}

export async function writeBuild(directory, release, packages = [{ id: 'datagrid', name: '@owp/datagrid', version: '3.5.0' }]) {
  const files = {
    'index.html': `<script src="${release.basePath}assets/app.js"></script><link rel="stylesheet" href="${release.basePath}assets/app.css">`,
    'robots.txt': 'User-agent: *\nDisallow: /',
    'assets/app.js': 'document.body.dataset.ready = "true";',
    'assets/app.css': 'body { margin: 0; }',
    'assets/version-menu-fixture.js': 'export function openVersionMenu() { return () => {}; }',
    'packages.json': JSON.stringify({ version: 1, packages: [
      ...packages.map((entry) => ({ ...entry, status: 'ready' })),
      { id: 'theme', name: '@owp/theme', version: null, status: 'planned' },
    ] }),
  };
  files['version-ui/runtime.json'] = JSON.stringify({ schemaVersion: 1, entry: { path: 'assets/version-menu-fixture.js', bytes: Buffer.byteLength(files['assets/version-menu-fixture.js']), sha256: fingerprint(files['assets/version-menu-fixture.js']) } });
  const records = [];
  for (const entry of packages) {
    const snippet = `snippets/${entry.id}/example.tsx`;
    const source = `export const packageVersion = '${entry.version}';\n`;
    const sha256 = fingerprint(source);
    const example = {
      packageId: entry.id, id: 'example', url: `${release.basePath}?package=${entry.id}&sample=example`,
      codeUrl: `${release.basePath}?package=${entry.id}&sample=example&tab=code`, location: null,
      entrypoint: `${release.basePath}${snippet}`, sha256,
    };
    const record = {
      id: `${entry.name}:Widget`, package: entry.name, packageVersion: entry.version,
      owner: 'Widget', name: 'Widget', path: '', kind: 'component', imports: [entry.name],
      description: '위젯', body: '위젯 사용법', signature: 'Widget(): void', requirement: 'declaration',
      related: [], guideIds: [], locale: 'ko', defaultDescription: null, usageNote: null,
      examples: [example], source: { path: 'index.d.ts', line: 1, sha256 }, sources: [],
      url: `${release.basePath}?package=${entry.id}&view=api&symbol=Widget`, contentHash: sha256,
    };
    const guide = { ...record, id: `${entry.name}:guide.start`, owner: 'guide', name: '시작하기', path: 'guide.start', kind: 'guide' };
    const dataset = {
      schemaVersion: 1, ...entry, dependencies: { [entry.name]: entry.version }, records: [record, guide], referenceRecords: [],
      examples: [{ packageId: entry.id, id: 'example', title: '예제', source: `${entry.id}/example.tsx` }],
    };
    files[`api/${entry.id}.json`] = JSON.stringify(dataset);
    files[`catalogs/${entry.id}.sources.json`] = JSON.stringify({
      version: 1, package: entry.name, packageVersion: entry.version,
      samples: [{ id: 'example', entrypoint: example.entrypoint, files: [{ path: example.entrypoint, sha256, dependencies: [] }] }],
    });
    files[snippet] = source;
    files[`knowledge/guides/${entry.id}/start.md`] = '# 시작하기\n\n위젯을 사용합니다.\n';
    records.push(record, guide);
  }
  files['knowledge/index.json'] = JSON.stringify({
    schemaVersion: 1, packages: packages.map((entry) => ({ ...entry, declarationHash: fingerprint(entry.name) })),
    resources: packages.flatMap((entry) => [`${release.basePath}api/${entry.id}.json`, `${release.basePath}catalogs/${entry.id}.sources.json`]),
    records: records.map(({ id, packageVersion }) => ({ id, packageVersion })),
  });
  files['knowledge/records.jsonl'] = `${records.map((record) => JSON.stringify(record)).join('\n')}\n`;
  files['knowledge/example-links.json'] = JSON.stringify({ schemaVersion: 1, packages });
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(directory, file)), { recursive: true });
    await writeFile(path.join(directory, file), content);
  }
  return directory;
}
