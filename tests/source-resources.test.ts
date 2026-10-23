import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createDataGridSourceManifest,
  createPackageSourceManifest,
  readSourceResources,
  sourceDependencyGraph,
} from '../scripts/source-resources';
import { gridCatalog } from '../src/playgrounds/datagrid/catalog';
import { coreCatalog } from '../src/playgrounds/core/catalog';

const roots: string[] = [];
async function fixture(files: Readonly<Record<string, string>>) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'source-resources-'));
  roots.push(root);
  await Promise.all(
    Object.entries(files).map(async ([file, content]) => {
      await mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await writeFile(path.join(root, file), content);
    }),
  );
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('source resources', () => {
  it('includes Core providers, styles and fetched JSON with the deployment base path', async () => {
    const root = path.resolve(import.meta.dirname, '..');
    const resources = await readSourceResources(root);
    const manifest = await createPackageSourceManifest({
      root,
      resources,
      catalog: coreCatalog,
      packageName: '@owp/core',
      basePath: '/releases/core/',
      supportFiles: [
        '/src/playgrounds/core/runtime/CoreProviders.tsx',
        '/src/playgrounds/core/styles.css',
      ],
    });
    expect(manifest.packageVersion).toBe('7.1.0');
    expect(manifest.samples.map((sample) => sample.id)).toEqual(
      coreCatalog.map((sample) => sample.id),
    );
    for (const sample of manifest.samples) {
      expect(sample.files.some((file) => file.path === sample.entrypoint)).toBe(true);
      expect(
        sample.files.some((file) => file.path.endsWith('/core/runtime/CoreProviders.tsx')),
      ).toBe(true);
      expect(sample.files.some((file) => file.path.endsWith('/core/styles.css'))).toBe(true);
      expect(sample.files.every((file) => file.path.startsWith('/releases/core/snippets/'))).toBe(
        true,
      );
      expect(sample.files.some((file) => file.path.endsWith('/core/runtime/Workspace.tsx'))).toBe(
        false,
      );
    }
    const query = manifest.samples.find((sample) => sample.id === 'query-selector');
    expect(
      query?.files.filter((file) => file.path.endsWith('.json')).length,
    ).toBeGreaterThanOrEqual(3);
    expect(query?.externalImports).toContain('@owp/core');
    expect(query?.externalImports).toContain('react-router-dom');
  });

  it('resolves type imports, reexports, index files, cycles and CSS when building the graph', async () => {
    // Given
    const root = await fixture({
      'src/entry.tsx': `import type { Row } from './types';
import { type Other } from './other';
export { value } from './barrel';
export * from './all';
export type { Props } from './props';
import './styles.css';
import source from './missing.ts?raw';`,
      'src/types.ts': 'export type Row = { id: string };',
      'src/other.ts': 'export type Other = string;',
      'src/barrel/index.tsx': "export { value } from '../all';",
      'src/all/index.ts': "import '../entry'; export const value = 1;",
      'src/props.ts': 'export type Props = string;',
      'src/styles.css': '@import "./nested.css"; .example { color: red; }',
      'src/nested.css': '.nested { display: block; }',
    });
    // When
    const graph = sourceDependencyGraph(await readSourceResources(root));
    // Then
    expect(graph['/src/entry.tsx']).toEqual([
      '/src/all/index.ts',
      '/src/barrel/index.tsx',
      '/src/other.ts',
      '/src/props.ts',
      '/src/styles.css',
      '/src/types.ts',
    ]);
    expect(graph['/src/all/index.ts']).toEqual(['/src/entry.tsx']);
    expect(graph['/src/styles.css']).toEqual(['/src/nested.css']);
  });

  it('reports the importer and missing target when a relative dependency cannot resolve', async () => {
    // Given
    const root = await fixture({ 'src/entry.ts': "export * from './missing';" });
    // When / Then
    await expect(readSourceResources(root)).rejects.toMatchObject({
      name: 'SourceDependencyError',
      importer: '/src/entry.ts',
      specifier: './missing',
    });
  });

  it('records the exact bytes and bounded dependency closure when generating a catalog manifest', async () => {
    // Given
    const source =
      "import { value } from '../model';\r\nimport './style.css';\r\nexport { value };\r\n";
    const root = await fixture({
      'src/playgrounds/datagrid/examples/server-save.tsx': source,
      'src/playgrounds/datagrid/examples/style.css': '.grid { color: red; }',
      'src/playgrounds/datagrid/examples/unrelated.tsx': 'export const unrelated = true;',
      'src/playgrounds/datagrid/model/index.ts': `import { useState } from 'react';
import type { TFunction } from 'i18next';
export * from '../examples/server-save';
export const value = useState;`,
      'node_modules/react/package.json': '{"version":"19.3.1"}',
      'node_modules/@owp/datagrid/package.json': '{"version":"3.1.3"}',
    });
    const resources = await readSourceResources(root);
    const catalog = [
      {
        id: 'save-changes',
        kind: 'grid',
        package: '@owp/datagrid',
        title: 'Save',
        description: 'Save changes',
        api: ['acceptChanges'],
        source: 'examples/server-save.tsx',
      },
    ];
    // When
    const manifest = await createDataGridSourceManifest({ root, catalog, resources });
    // Then
    expect(manifest.packageVersion).toBe('3.1.3');
    expect(manifest.dependencyVersions).toEqual({ '@owp/datagrid': '3.1.3', react: '19.3.1' });
    const sample = manifest.samples[0];
    expect(sample).toMatchObject({
      ...catalog[0],
      entrypoint: '/snippets/playgrounds/datagrid/examples/server-save.tsx',
      externalImports: ['react'],
    });
    expect(sample?.files.map((file) => file.path)).toEqual([
      '/snippets/playgrounds/datagrid/examples/server-save.tsx',
      '/snippets/playgrounds/datagrid/examples/style.css',
      '/snippets/playgrounds/datagrid/model/index.ts',
    ]);
    expect(sample?.files[0]).toMatchObject({
      sha256: createHash('sha256').update(source).digest('hex'),
      dependencies: [
        '/snippets/playgrounds/datagrid/examples/style.css',
        '/snippets/playgrounds/datagrid/model/index.ts',
      ],
    });
  });

  it('uses installed package versions and original source bytes for every real catalog entry', async () => {
    // Given
    const root = path.resolve(import.meta.dirname, '..');
    const resources = await readSourceResources(root);
    // When
    const manifest = await createDataGridSourceManifest({ root, catalog: gridCatalog, resources });
    // Then
    const installed: unknown = JSON.parse(
      await readFile(path.join(root, 'node_modules/@owp/datagrid/package.json'), 'utf8'),
    );
    expect(installed).toMatchObject({ version: manifest.packageVersion });
    expect(manifest.samples.map((sample) => sample.id)).toEqual(
      gridCatalog.map((sample) => sample.id),
    );
    for (const sample of manifest.samples) {
      expect(sample.files.some((file) => file.path === sample.entrypoint)).toBe(true);
      if (sample.kind === 'grid') {
        expect(sample.files.some((file) => file.path.includes('/examples/configs/'))).toBe(true);
        expect(sample.files.some((file) => file.path.endsWith('/types/index.ts'))).toBe(true);
        expect(sample.files.some((file) => file.path.endsWith('/examples/styles.css'))).toBe(true);
        expect(sample.files.some((file) => file.path.includes('/datagrid/runtime/'))).toBe(false);
      }
      const otherEntrypoints = manifest.samples
        .filter((entry) => entry.id !== sample.id)
        .map((entry) => entry.entrypoint);
      expect(sample.files.some((file) => otherEntrypoints.includes(file.path))).toBe(false);
      expect(
        sample.files.some((file) => /\/(?:gridRegistry|GridPreview)\.tsx?$/.test(file.path)),
      ).toBe(false);
      for (const file of sample.files) {
        const bytes = await readFile(path.join(root, file.path.replace('/snippets/', 'src/')));
        expect(file.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
      }
    }
  });
});
