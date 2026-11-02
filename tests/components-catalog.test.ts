import { access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { buildNavigationModel } from '../src/app/layout/navigation';
import { componentsCatalog, componentsCategories } from '../src/playgrounds/components/catalog';
import { completedPlaygroundPackages } from '../src/playgrounds/packages';
import {
  componentsPackage,
  createPlaygroundUrl,
  getPlaygroundRoute,
  readPlaygroundRoute,
} from '../src/playgrounds/registry';

const origin = 'https://playground.example/';

describe('Components playground', () => {
  it('exposes component, hook and utility menus without registering unpublished Knowledge', () => {
    const model = buildNavigationModel({
      playground: componentsPackage,
      examples: componentsCatalog,
      categories: componentsCategories,
      currentId: componentsCatalog[0]?.id ?? '',
      isApi: false,
      getExampleUrl: (id) =>
        createPlaygroundUrl(origin, getPlaygroundRoute(componentsPackage, id)).href,
    });
    const grouped = model.groups.filter((group) => group.type === 'examples');
    const examples = grouped.find((group) => group.id === 'examples');
    const reference = grouped.find((group) => group.id === 'reference');
    expect(model.groups.map((group) => group.id)).toEqual(['docs', 'examples', 'reference']);
    const docs = model.groups.find((group) => group.type === 'docs');
    expect(docs?.items.map((item) => item.id)).toEqual(['getting-started', 'api']);
    expect(examples?.categories.map((group) => group.id)).toEqual([
      'input-examples',
      'data-examples',
      'workflow-examples',
      'layout-examples',
    ]);
    expect(reference?.categories.map((group) => group.id)).toEqual([
      'components',
      'hooks',
      'utils',
    ]);
    expect(reference?.categories.flatMap((group) => group.items)).toHaveLength(47);
    expect(examples?.categories.every((group) => group.items.length > 0)).toBe(true);
    expect(model.exampleCount).toBe(53);
    expect(model.exampleCount).toBe(
      componentsCatalog.filter((entry) => entry.kind === 'component').length,
    );
    expect(completedPlaygroundPackages.some((entry) => String(entry.id) === 'components')).toBe(
      false,
    );
    expect(componentsCatalog.every((entry) => entry.package === '@owp/components')).toBe(true);
    const items = model.groups.flatMap((group) =>
      group.type === 'docs' ? group.items : group.categories.flatMap((category) => category.items),
    );
    expect(new Set(items.map((item) => item.id)).size).toBe(componentsCatalog.length + 1);
  });

  it('provides unique menu IDs, existing source files and round-trippable code links', async () => {
    expect(new Set(componentsCatalog.map((entry) => entry.id)).size).toBe(componentsCatalog.length);
    for (const example of componentsCatalog) {
      await access(new URL(`../src/playgrounds/components/${example.source}`, import.meta.url));
      const query = new URLSearchParams({
        package: '@owp/components',
        sample: example.id,
        tab: 'code',
        file: `playgrounds/components/${example.source}`,
        line: '1',
        endLine: '3',
      });
      const route = readPlaygroundRoute(`?${query}`);
      expect(route).toMatchObject({
        status: 'components',
        example,
        tab: 'code',
        codeTarget: { file: query.get('file'), line: 1, endLine: 3 },
      });
      const url = createPlaygroundUrl(`${origin}?lang=en#main-content`, route);
      expect(url.searchParams.get('package')).toBe('components');
      expect(url.searchParams.get('lang')).toBe('en');
      expect(url.hash).toBe('#main-content');
      expect(readPlaygroundRoute(url.search)).toEqual(route);
    }
  });

  it('uses a valid Components default and discards a source target from another package', () => {
    expect(getPlaygroundRoute(componentsPackage)).toMatchObject({
      status: 'components',
      example: { id: 'getting-started', kind: 'guide' },
    });
    for (const sample of ['', 'unknown', '__proto__']) {
      const route = readPlaygroundRoute(`?package=components&sample=${sample}`);
      expect(route).toMatchObject({
        status: 'components',
        example: { id: 'getting-started', kind: 'guide' },
      });
    }
    expect(readPlaygroundRoute('?package=components&sample=api')).toMatchObject({
      status: 'api',
      playground: componentsPackage,
      symbol: null,
    });
    const route = readPlaygroundRoute(
      '?package=components&tab=code&file=playgrounds/core/examples/api-query.tsx&line=1',
    );
    expect(route).not.toHaveProperty('codeTarget', expect.anything());
  });
});
