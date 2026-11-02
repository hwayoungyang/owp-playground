import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  navigationUsesSessionStorage,
  parseNavigationPreferences,
  readNavigationSnapshot,
  updateNavigationPreferences,
} from '../src/app/layout/navigation-preferences';
import { navigationResults, searchNavigation } from '../src/app/layout/navigation-search';
import type { NavigationViewModel } from '../src/app/layout/navigation';

function storageWindow(fails = false) {
  const values = new Map<string, string>();
  return Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (fails) throw new DOMException('Storage unavailable', 'SecurityError');
        values.set(key, value);
      },
    },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('navigation preferences', () => {
  it('keeps unavailable favorites stored while excluding them from the visible capacity', () => {
    // Given
    const raw = JSON.stringify({
      version: 1,
      recent: ['removed-page', 'current-page'],
      favorites: ['removed-page', 'current-page'],
    });
    // When
    const visible = parseNavigationPreferences(raw, new Set(['current-page']));
    // Then
    expect(visible).toEqual({ recent: ['current-page'], favorites: ['current-page'] });
    expect(parseNavigationPreferences(raw).favorites).toEqual(['removed-page', 'current-page']);
  });

  it('reclaims only the oldest unavailable favorite when the stored capacity is full', () => {
    // Given
    vi.stubGlobal('window', storageWindow());
    const ids = Array.from({ length: 12 }, (_, index) => `page-${index}`);
    for (const id of ids)
      updateNavigationPreferences({ packageId: 'removed-pages', id, action: 'favorite' });
    const availableIds = new Set(['new-page', ...ids.slice(2)]);
    // When
    updateNavigationPreferences({
      packageId: 'removed-pages',
      id: 'new-page',
      action: 'favorite',
      availableIds,
    });
    // Then
    const raw = readNavigationSnapshot('removed-pages');
    expect(parseNavigationPreferences(raw).favorites).toEqual([
      'new-page',
      ...ids.slice(1).reverse(),
    ]);
    expect(parseNavigationPreferences(raw, availableIds).favorites).toEqual([
      'new-page',
      ...ids.slice(2).reverse(),
    ]);
  });

  it('preserves existing favorites when the capacity is reached', () => {
    // Given
    vi.stubGlobal('window', storageWindow());
    for (let index = 0; index < 12; index += 1)
      updateNavigationPreferences({
        packageId: 'capacity',
        id: `page-${index}`,
        action: 'favorite',
      });
    // When
    updateNavigationPreferences({ packageId: 'capacity', id: 'extra-page', action: 'favorite' });
    // Then
    expect(parseNavigationPreferences(readNavigationSnapshot('capacity')).favorites).toEqual(
      Array.from({ length: 12 }, (_, index) => `page-${11 - index}`),
    );
  });
  it.each([
    '',
    '{broken',
    '{"version":2,"recent":[],"favorites":[]}',
    '{"version":1,"recent":[7],"favorites":[]}',
  ])('uses an empty preference record when persisted data is invalid: %s', (raw) => {
    // Given / When
    const result = parseNavigationPreferences(raw);
    // Then
    expect(result).toEqual({ recent: [], favorites: [] });
  });

  it('deduplicates and bounds stored page IDs', () => {
    // Given
    const ids = Array.from({ length: 20 }, (_, index) => `page-${index}`);
    // When
    const result = parseNavigationPreferences(
      JSON.stringify({ version: 1, recent: ['page-0', ...ids], favorites: ['page-0', ...ids] }),
    );
    // Then
    expect(result.recent).toEqual(ids.slice(0, 8));
    expect(result.favorites).toEqual(ids.slice(0, 12));
  });

  it('moves an existing visit to the front without duplication', () => {
    // Given
    vi.stubGlobal('window', storageWindow());
    for (const id of ['first', 'second'])
      updateNavigationPreferences({ packageId: 'visits', id, action: 'visit' });
    // When
    updateNavigationPreferences({ packageId: 'visits', id: 'first', action: 'visit' });
    // Then
    expect(parseNavigationPreferences(readNavigationSnapshot('visits')).recent).toEqual([
      'first',
      'second',
    ]);
  });

  it('keeps favorites independent between packages', () => {
    // Given
    vi.stubGlobal('window', storageWindow());
    updateNavigationPreferences({ packageId: 'core', id: 'same-id', action: 'favorite' });
    // When
    updateNavigationPreferences({ packageId: 'charts', id: 'other-id', action: 'favorite' });
    // Then
    expect(parseNavigationPreferences(readNavigationSnapshot('core')).favorites).toEqual([
      'same-id',
    ]);
    expect(parseNavigationPreferences(readNavigationSnapshot('charts')).favorites).toEqual([
      'other-id',
    ]);
  });

  it('removes a favorite when toggled again', () => {
    // Given
    vi.stubGlobal('window', storageWindow());
    updateNavigationPreferences({ packageId: 'toggle', id: 'page', action: 'favorite' });
    // When
    updateNavigationPreferences({ packageId: 'toggle', id: 'page', action: 'favorite' });
    // Then
    expect(parseNavigationPreferences(readNavigationSnapshot('toggle')).favorites).toEqual([]);
  });

  it('keeps navigation preferences usable when browser storage rejects writes', () => {
    // Given
    vi.stubGlobal('window', storageWindow(true));
    // When
    updateNavigationPreferences({
      packageId: 'restricted-storage',
      id: 'page',
      action: 'favorite',
    });
    // Then
    expect(
      parseNavigationPreferences(readNavigationSnapshot('restricted-storage')).favorites,
    ).toEqual(['page']);
    expect(navigationUsesSessionStorage('restricted-storage')).toBe(true);
  });
});

const model: NavigationViewModel = {
  exampleCount: 1,
  currentCategoryLabel: 'Utils',
  groups: [
    {
      type: 'docs',
      id: 'docs',
      label: '문서',
      items: [
        { id: 'intro', title: '시작하기', url: '?sample=intro', active: false, kind: 'guide' },
      ],
    },
    {
      type: 'examples',
      id: 'examples',
      label: '예제',
      categories: [
        {
          id: 'hooks',
          label: 'Hooks',
          items: [
            {
              id: 'request',
              title: 'API 요청',
              url: '?sample=request',
              active: false,
              api: ['useRequest'],
              description: '조회와 취소',
            },
          ],
        },
      ],
    },
    {
      type: 'examples',
      id: 'reference',
      label: '공개 API',
      categories: [
        {
          id: 'utils',
          label: 'Utils',
          items: [
            {
              id: 'export:create',
              title: 'createInstance',
              url: '?sample=export%3Acreate',
              active: true,
              api: ['@owp/core/i18n'],
            },
          ],
        },
      ],
    },
  ],
};

describe('contextual navigation search', () => {
  it('retains original routes and identifies guides, examples and APIs', () => {
    // Given / When
    const results = navigationResults(model);
    // Then
    expect(results.map(({ item, kind, category }) => [item.id, item.url, kind, category])).toEqual([
      ['intro', '?sample=intro', '가이드', '문서'],
      ['request', '?sample=request', '예제', 'Hooks'],
      ['export:create', '?sample=export%3Acreate', 'API', 'Utils'],
    ]);
  });

  it.each([
    ['I18N', 'export:create'],
    ['useRequest', 'request'],
    ['조회', 'request'],
    ['Getting started', 'intro'],
  ])('finds metadata and translated titles for %s', (query, expectedId) => {
    // Given
    const entries = navigationResults(model);
    // When
    const result = searchNavigation({
      entries,
      query,
      translate: (value) => (value === '시작하기' ? 'Getting started' : value),
    });
    // Then
    expect(result.map(({ item }) => item.id)).toEqual([expectedId]);
  });
});
