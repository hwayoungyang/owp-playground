import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { exampleSourcePath, legacySourcePaths } from '../src/features/code/source-paths';
import { findIntegrationExample } from '../src/playgrounds/integrations/catalog';

describe('package source resources', () => {
  it('registers value presence and all KST utilities against their executable example files', async () => {
    const value = findIntegrationExample('utils', 'value-format');
    const kst = findIntegrationExample('date-picker', 'kst-date-time');
    expect(value?.api).toContain('hasValue');
    expect(kst?.api).toEqual([
      'formatKstDateTime',
      'getKstToday',
      'getKstCurrentTime',
      'getKstCurrentDateTime',
      'getKstDate',
      'getKstDayStart',
      'parseKstDateTime',
      'KstDateOptions',
    ]);
    expect(kst?.source).toBe('examples/kst-date-time.tsx');
    const workspace = await readFile(
      new URL('../src/playgrounds/integrations/Workspace.tsx', import.meta.url),
      'utf8',
    );
    for (const example of [value, kst]) {
      if (!example) throw new TypeError('Expected the registered integration example');
      const source = exampleSourcePath(example);
      await access(new URL(`../src/${source}`, import.meta.url));
      expect(workspace).toContain(`'${source}'`);
    }
  });
  it('keeps identical sample filenames in their owning package', () => {
    const examples = [
      { package: '@owp/datagrid', source: 'examples/overview.tsx' },
      { package: '@owp/components', source: 'examples/overview.tsx' },
    ];

    const paths = examples.map(exampleSourcePath);

    expect(paths).toEqual([
      'playgrounds/datagrid/examples/overview.tsx',
      'playgrounds/components/examples/overview.tsx',
    ]);
  });

  it('resolves every retained public URL to an existing source file', async () => {
    const aliases = Object.entries(legacySourcePaths);

    const resolved = await Promise.allSettled(
      aliases.map(([, target]) => access(new URL(`../src/${target}`, import.meta.url))),
    );

    for (const [index, result] of resolved.entries()) {
      expect(result.status, aliases[index]?.[0]).toBe('fulfilled');
    }
  });
});
