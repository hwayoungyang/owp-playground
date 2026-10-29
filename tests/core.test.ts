import { access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { coreCatalog, coreCategories, findCoreEntry } from '../src/playgrounds/core/catalog';
import { createPlaygroundUrl, readPlaygroundRoute } from '../src/playgrounds/registry';
import { corePackage } from '../src/playgrounds/packages';
import { coreEnglish } from '../src/playgrounds/core/locales/en';
import { readCodeLocation } from '../src/features/code/code-location';
import { exampleSourcePath } from '../src/features/code/source-paths';

describe('Core Playground integration', () => {
  it('uses the installed 10.3.0 contract and a useful default route', () => {
    expect(corePackage.version).toBe('10.3.0');
    expect(readPlaygroundRoute('?package=%40owp%2Fcore')).toMatchObject({
      status: 'core',
      playground: { id: 'core' },
      example: { id: 'getting-started' },
    });
    expect(findCoreEntry('unknown').id).toBe('getting-started');
    for (const id of ['table', 'field-table']) {
      expect(readPlaygroundRoute(`?package=core&sample=${id}`)).toMatchObject({
        status: 'core',
        example: { id: 'getting-started' },
      });
    }
  });

  it('connects every example to its actual source and translated category', async () => {
    const examples = coreCatalog.filter((entry) => entry.kind === 'core');
    expect(coreCatalog).toHaveLength(26);
    expect(examples).toHaveLength(20);
    expect(coreCatalog.filter((entry) => entry.kind === 'guide')).toHaveLength(6);
    expect(new Set(coreCatalog.map((entry) => entry.id)).size).toBe(coreCatalog.length);
    for (const example of coreCatalog) {
      await access(new URL(`../src/playgrounds/core/${example.source}`, import.meta.url));
      expect(readPlaygroundRoute(`?package=core&sample=${example.id}`)).toMatchObject({
        status: 'core',
        playground: { id: 'core', name: '@owp/core' },
        example: { id: example.id, package: '@owp/core' },
      });
      const file = exampleSourcePath(example);
      const codeQuery = new URLSearchParams({ file, line: '1' });
      expect(readCodeLocation(codeQuery, 'core')).toEqual({ file, line: 1, endLine: 1 });
      expect(readCodeLocation(codeQuery, 'datagrid')).toBeUndefined();
      expect(coreEnglish[example.title]).toBeTruthy();
      if (example.kind === 'core') {
        expect(coreCategories.some((category) => category.id === example.category)).toBe(true);
        expect(coreEnglish[example.description]).toBeTruthy();
      }
    }
  });

  it.each(['getting-started', 'providers', 'state-management', 'api-setup', 'theme-settings'])(
    'round-trips the %s guide with its source code target',
    (id) => {
      // Given
      const file = `playgrounds/core/guides/${id}.tsx`;
      const parameters = new URLSearchParams({
        package: 'core',
        sample: id,
        tab: 'code',
        file,
        line: '2',
        endLine: '4',
      });

      // When
      const route = readPlaygroundRoute(`?${parameters}`);
      const url = createPlaygroundUrl('https://example.test/?lang=en', route);

      // Then
      expect(route).toMatchObject({
        status: 'core',
        example: { id, kind: 'guide', category: 'start', source: `guides/${id}.tsx` },
        tab: 'code',
        codeTarget: { file, line: 2, endLine: 4 },
      });
      expect(readPlaygroundRoute(url.search)).toEqual(route);
      expect(url.searchParams.get('lang')).toBe('en');
    },
  );

  it('places app setup before UI examples and preserves contiguous category groups', () => {
    const examples = coreCatalog.filter((entry) => entry.kind === 'core');
    const categoryOrder = [...new Set(examples.map((example) => example.category))];

    expect(coreCategories).toEqual([
      { id: 'hooks', label: 'Hooks' },
      { id: 'utils', label: 'Utils' },
      { id: 'integration', label: 'Package Integration' },
    ]);
    expect(coreCatalog[0]).toMatchObject({ id: 'getting-started', kind: 'guide' });
    expect(
      examples.filter((example) => example.category === 'hooks').map((example) => example.id),
    ).toEqual([
      'api-query',
      'api-inspector',
      'file-transfer',
      'app-settings',
      'user-permissions',
      'language-switcher',
      'dialog',
      'discard-guard',
      'confirm',
      'loading',
    ]);
    expect(
      examples.filter((example) => example.category === 'utils').map((example) => example.id),
    ).toEqual(['request-parameters', 'auth-input', 'zip-download']);
    expect(
      examples.filter((example) => example.category === 'integration').map((example) => example.id),
    ).toEqual([
      'query-selector',
      'common-code',
      'excel-export',
      'error-boundary',
      'page-carded',
      'page-content',
      'search-filter',
    ]);
    expect(categoryOrder).toEqual(coreCategories.map((category) => category.id));
    expect(examples.map((example) => example.category)).toEqual(
      coreCategories.flatMap((category) =>
        examples
          .filter((example) => example.category === category.id)
          .map((example) => example.category),
      ),
    );
    for (const category of coreCategories) expect(coreEnglish[category.label]).toBeTruthy();
  });

  it('round-trips Core code links and rejects another package source', () => {
    const query =
      '?package=core&sample=dialog&tab=code&file=playgrounds/core/examples/dialog.tsx&line=20&endLine=22';
    const route = readPlaygroundRoute(query);
    expect(route).toMatchObject({
      status: 'core',
      tab: 'code',
      codeTarget: { line: 20, endLine: 22 },
    });
    const url = createPlaygroundUrl('https://example.test/?lang=en', route);
    expect(readPlaygroundRoute(url.search)).toEqual(route);
    expect(url.searchParams.get('lang')).toBe('en');
    expect(
      readCodeLocation(
        new URLSearchParams('file=playgrounds/charts/examples/line.tsx&line=1'),
        'core',
      ),
    ).toBeUndefined();
    expect(
      readCodeLocation(new URLSearchParams('file=playgrounds/core/../../secret.ts&line=1'), 'core'),
    ).toBeUndefined();
  });
});
