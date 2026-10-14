import { access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { legacySourcePaths, sampleSourcePath } from '../src/features/code/source-paths';

describe('package source resources', () => {
  it('keeps identical sample filenames in their owning package', () => {
    const samples = [
      { package: '@owp/datagrid', source: 'examples/overview.tsx' },
      { package: '@owp/components', source: 'examples/overview.tsx' },
    ];

    const paths = samples.map(sampleSourcePath);

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
