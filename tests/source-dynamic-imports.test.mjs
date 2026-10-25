import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { readSourceResources } from '../scripts/source-resources.ts';

async function resourcesFor(files) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'owp-dynamic-sources-'));
  try {
    await mkdir(path.join(root, 'src'));
    for (const [file, content] of Object.entries(files))
      await writeFile(path.join(root, 'src', file), content);
    return await readSourceResources(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

it('includes lazy public imports in source manifests without loading the module', async () => {
  // Given
  const content = `import type { CoreChartProps } from '@owp/charts/types';
    export const load = () => import('@owp/charts').then(({ CoreChart }) => CoreChart);`;
  // When
  const resources = await resourcesFor({ 'entry.ts': content });
  // Then
  expect(resources.get('/src/entry.ts')?.externalImports).toEqual(['@owp/charts']);
});

it('includes relative lazy modules in the same dependency graph as static imports', async () => {
  // Given
  const files = {
    'entry.ts': "export const load = () => import('./lazy');",
    'lazy.ts': 'export const value = 1;',
  };
  // When
  const resources = await resourcesFor(files);
  // Then
  expect(resources.get('/src/entry.ts')?.dependencies).toEqual(['/src/lazy.ts']);
});

it('rejects a missing lazy dependency instead of publishing an incomplete source archive', async () => {
  // Given
  const files = { 'entry.ts': "export const load = () => import('./missing');" };
  // When / Then
  await expect(resourcesFor(files)).rejects.toMatchObject({
    name: 'SourceDependencyError',
    importer: '/src/entry.ts',
    specifier: './missing',
  });
});
