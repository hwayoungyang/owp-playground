import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, realpath, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { ApiExampleSummary, ApiRecord } from '../src/features/api/model/schema.ts';
import { createPackageKnowledge } from '../src/features/api/model/package-data.ts';
import type { ReleaseIndexEntry } from '../src/features/releases/model/schema.ts';

export const hash = (content: string) => createHash('sha256').update(content).digest('hex');
export const source =
  "import type { Row } from './types';\nexport const Example = () => <div>OWP</div>;\n";

function record(packageId: string, version: string, guide: boolean): ApiRecord {
  const owner = packageId === 'datagrid' ? 'OwpDataGrid' : 'ChartFrame';
  const name = guide ? (packageId === 'datagrid' ? 'connection' : 'composition') : owner;
  return {
    id: `@owp/${packageId}:${guide ? 'guide.' : ''}${name}`,
    package: `@owp/${packageId}`,
    packageVersion: version,
    owner: guide ? 'guide' : owner,
    name,
    path: guide ? `guide.${name}` : '',
    kind: guide ? 'guide' : 'component',
    imports: [`@owp/${packageId}`],
    description: guide ? '기본 연결 가이드' : 'OWP component',
    body: guide ? '설치한 패키지의 public API를 연결합니다.' : 'API contract',
    signature: guide ? '' : `export declare const ${owner}: Component`,
    requirement: 'declaration',
    related: [],
    guideIds: [],
    locale: 'ko',
    defaultDescription: null,
    usageNote: null,
    examples: [],
    source: { path: 'index.d.ts', line: 1, sha256: hash('declaration') },
    sources: [],
    url: `/?${new URLSearchParams({ package: packageId, view: 'api', symbol: `@owp/${packageId}:${guide ? 'guide.' : ''}${name}` })}`,
    contentHash: hash(name),
  };
}

export async function createMcpFixture(knowledge?: {
  readonly packages: readonly {
    readonly id: string;
    readonly name: string;
    readonly version: string;
  }[];
  readonly dependencies: Readonly<Record<string, string>>;
  readonly records: readonly ApiRecord[];
  readonly examples: readonly ApiExampleSummary[];
}) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'owp-mcp-')));
  const releases: ReleaseIndexEntry[] = [];
  for (const [releaseId, version, channel] of [
    ['release-old', '1.0.0', 'stable'],
    ['release-new', '2.0.0', 'stable'],
    ['release-draft', '3.0.0', 'draft'],
  ] as const) {
    const packages = (knowledge?.packages.map((entry) => entry.id) ?? ['datagrid', 'charts']).map(
      (id) => ({
        id,
        name: `@owp/${id}`,
        version: knowledge?.packages.find((entry) => entry.id === id)?.version ?? version,
      }),
    );
    const files: Record<string, string> = {
      'index.html': '<!doctype html><title>OWP</title>',
      'knowledge/index.json': JSON.stringify({ schemaVersion: 1, packages }),
    };
    for (const pkg of packages) {
      files[`api/${pkg.id}.json`] = JSON.stringify(
        knowledge
          ? createPackageKnowledge(knowledge, pkg)
          : {
              schemaVersion: 1,
              ...pkg,
              dependencies: {},
              records: [record(pkg.id, version, false), record(pkg.id, version, true)].map(
                (item) => ({
                  ...item,
                  url: `/versions/${releaseId}${item.url}`,
                }),
              ),
              referenceRecords: [],
              examples: [],
            },
      );
      const entrypoint = `/versions/${releaseId}/snippets/playgrounds/${pkg.id}/examples/basic.tsx`;
      const dependency = `/versions/${releaseId}/snippets/playgrounds/${pkg.id}/examples/types.ts`;
      const dependencyContent = 'export type Row = { readonly id: string };\n';
      files[`snippets/playgrounds/${pkg.id}/examples/basic.tsx`] = source;
      files[`snippets/playgrounds/${pkg.id}/examples/types.ts`] = dependencyContent;
      files[`catalogs/${pkg.id}.sources.json`] = JSON.stringify({
        version: 1,
        package: pkg.name,
        packageVersion: version,
        dependencyVersions: { [pkg.name]: version, react: '19.0.0' },
        samples: [
          {
            id: 'basic',
            title: 'Basic OWP',
            kind: 'example',
            package: pkg.name,
            description: '기본 실행 예제',
            source: 'examples/basic.tsx',
            api: [],
            entrypoint,
            externalImports: ['react'],
            files: [
              {
                path: entrypoint,
                sha256: hash(source),
                dependencies: [dependency],
                externalImports: ['react'],
              },
              {
                path: dependency,
                sha256: hash(dependencyContent),
                dependencies: [],
                externalImports: [],
              },
            ],
          },
        ],
      });
    }
    const manifest = {
      schemaVersion: 1,
      releaseId,
      createdAt: '2026-10-23T00:00:00.000Z',
      appVersion: '0.1.0',
      commit: '1234567',
      dirty: channel === 'draft',
      channel,
      basePath: `/versions/${releaseId}/`,
      packages,
      files: Object.fromEntries(
        Object.entries(files).map(([file, content]) => [
          file,
          { bytes: Buffer.byteLength(content), sha256: hash(content) },
        ]),
      ),
    };
    const manifestContent = JSON.stringify(manifest);
    for (const [file, content] of Object.entries({
      ...files,
      'knowledge-release.json': manifestContent,
    })) {
      const target = path.join(root, 'versions', releaseId, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
    }
    releases.push({
      releaseId,
      createdAt: manifest.createdAt,
      basePath: manifest.basePath,
      packages,
      manifestSha256: hash(manifestContent),
      channel,
    });
  }
  await writeFile(
    path.join(root, 'versions/index.json'),
    JSON.stringify({ schemaVersion: 1, latestReleaseId: 'release-draft', releases }),
  );
  return root;
}
