import { describe, expect, it } from 'vitest';
import { buildNavigationModel } from '../src/app/layout/navigation';
import {
  publicApiNavigationGroup,
  publicApiNavigationGroups,
} from '../src/features/public-api/grouping';
import type { PublicApiSummary } from '../src/features/public-api/types';
import { componentsCatalog, componentsCategories } from '../src/playgrounds/components/catalog';
import { componentsPackage } from '../src/playgrounds/packages';

const component = (name: string, modules = ['@owp/components']): PublicApiSummary => ({
  id: name,
  name,
  packageId: 'components',
  kind: 'component',
  group: 'components',
  modules,
  description: '',
});

describe('Components navigation categories', () => {
  it('keeps icons separate from tables and sections without losing links or selection', () => {
    const entries = [
      component('OwpTable'),
      component('OwpSection'),
      component('Visibility', ['@owp/components/icons']),
      component('OwpSvgIcon'),
      component('FutureComponent'),
    ];
    const model = buildNavigationModel({
      playground: componentsPackage,
      examples: componentsCatalog,
      categories: componentsCategories,
      currentId: 'export:OwpTable',
      isApi: false,
      publicEntries: entries,
      getExampleUrl: (id) => `?package=components&sample=${encodeURIComponent(id)}&lang=en`,
    });
    const reference = model.groups.find(
      (group) => group.type === 'examples' && group.id === 'reference',
    );
    if (!reference || reference.type !== 'examples') throw new RangeError('Missing API navigation');
    const ids = reference.categories.flatMap((category) => category.items.map((item) => item.id));
    expect(ids).toHaveLength(entries.length);
    expect(new Set(ids).size).toBe(entries.length);
    expect(
      reference.categories
        .find((category) => category.id === 'public-component-icons')
        ?.items.map((item) => item.title),
    ).toEqual(['Visibility', 'OwpSvgIcon']);
    expect(
      reference.categories.find((category) => category.id === 'public-component-tables')?.items,
    ).toEqual([
      expect.objectContaining({
        id: 'export:OwpTable',
        active: true,
        url: '?package=components&sample=export%3AOwpTable&lang=en',
      }),
    ]);
    for (const entry of entries)
      expect(
        reference.categories
          .find((category) => category.id === `public-${publicApiNavigationGroup(entry)}`)
          ?.items.some((item) => item.id === `export:${entry.id}`),
      ).toBe(true);
  });

  it('preserves other packages and non-component API groups', () => {
    expect(publicApiNavigationGroup({ ...component('OwpTable'), packageId: 'core' })).toBe(
      'components',
    );
    expect(publicApiNavigationGroup({ ...component('OwpTableProps'), group: 'types' })).toBe(
      'types',
    );
    expect(publicApiNavigationGroups('core').map((group) => group.id)).toContain('components');
    expect(publicApiNavigationGroups('core').some((group) => group.id === 'component-icons')).toBe(
      false,
    );
  });
});
