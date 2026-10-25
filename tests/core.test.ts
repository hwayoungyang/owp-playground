import { access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { coreCatalog, coreCategories, findCoreEntry } from '../src/playgrounds/core/catalog';
import { createPlaygroundUrl, readPlaygroundRoute } from '../src/playgrounds/registry';
import { corePackage } from '../src/playgrounds/packages';
import { coreEnglish } from '../src/playgrounds/core/locales/en';
import { readCodeLocation } from '../src/features/code/code-location';
import { exampleSourcePath } from '../src/features/code/source-paths';

describe('Core Playground integration', () => {
  it('uses the installed 8.1.0 contract and a useful default route', () => {
    expect(corePackage.version).toBe('8.1.0');
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
    expect(coreCatalog).toHaveLength(15);
    expect(examples).toHaveLength(14);
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

  it('places app setup before UI examples and preserves contiguous category groups', () => {
    const examples = coreCatalog.filter((entry) => entry.kind === 'core');
    const categoryOrder = [...new Set(examples.map((example) => example.category))];

    expect(coreCategories).toEqual([
      { id: 'api', label: 'API·데이터 연결' },
      { id: 'state', label: '앱 상태·설정' },
      { id: 'policy', label: '전역 상태·복구' },
      { id: 'adapter', label: 'UI Adapter' },
    ]);
    expect(coreCatalog[0]).toMatchObject({ id: 'getting-started', kind: 'guide' });
    expect(
      examples.filter((example) => example.category === 'api').map((example) => example.id),
    ).toEqual(['api-query', 'query-selector', 'common-code', 'excel-export']);
    expect(
      examples.filter((example) => example.category === 'state').map((example) => example.id),
    ).toEqual(['app-settings', 'user-permissions', 'language-switcher']);
    expect(
      examples.filter((example) => example.category === 'policy').map((example) => example.id),
    ).toEqual(['dialog', 'confirm', 'loading', 'error-boundary']);
    expect(
      examples.filter((example) => example.category === 'adapter').map((example) => example.id),
    ).toEqual(['page-carded', 'page-content', 'search-filter']);
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
