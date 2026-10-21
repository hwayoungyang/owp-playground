import { expect, it } from 'vitest';
import { buildNavigationModel } from '../src/app/layout/navigation';
import { chartCatalog, chartCategories } from '../src/playgrounds/charts/catalog';
import { chartConsolidations } from '../src/playgrounds/charts/model/consolidations';
import { gridCatalog, categories as gridCategories } from '../src/playgrounds/datagrid/catalog';
import { exampleApiLinks } from '../src/features/api/model/links';
import {
  chartsPackage,
  dataGridPackage,
  getPlaygroundRoute,
  createPlaygroundUrl,
  readPlaygroundRoute,
} from '../src/playgrounds/registry';

it('groups connection methods and shared controls under Grid API while preserving URLs', () => {
  // Given
  const model = buildNavigationModel({
    playground: dataGridPackage,
    examples: gridCatalog,
    categories: gridCategories,
    currentId: 'ref-focus',
    isApi: false,
    getExampleUrl: (id) => `/?package=datagrid&sample=${id}`,
  });

  // When
  const categories = model.groups.find((group) => group.type === 'examples')?.categories ?? [];
  const api = categories.find((category) => category.id === 'grid-api');

  // Then
  expect(api?.items.map((item) => item.id)).toEqual([
    'hook-connection',
    'ref-connection',
    'ref-data',
    'ref-focus',
    'ref-move',
    'ref-changes',
  ]);
  expect(categories.some((category) => ['hook-api', 'ref-api'].includes(category.id))).toBe(false);
  for (const item of api?.items ?? [])
    expect(readPlaygroundRoute(new URL(item.url, 'https://example.test').search).example?.id).toBe(
      item.id,
    );
});

it('places chart variants by learning goal without dropping or duplicating routes', () => {
  // Given
  const model = buildNavigationModel({
    playground: chartsPackage,
    examples: chartCatalog,
    categories: chartCategories,
    currentId: 'time-line',
    isApi: false,
    getExampleUrl: (id) => `/?package=charts&sample=${id}`,
  });

  // When
  const groups = model.groups.find((group) => group.type === 'examples')?.categories ?? [];
  const items = groups.flatMap((group) => group.items);

  // Then
  expect(new Set(items.map((item) => item.id)).size).toBe(70);
  expect(items).toHaveLength(70);
  for (const [id, category] of [
    ['grouped-stacks-by-line', 'types'],
    ['area', 'types'],
    ['daily-combo', 'types'],
    ['radar', 'types'],
    ['histogram', 'types'],
    ['line-multi-axis', 'axes'],
    ['date-time', 'axes'],
    ['time-line', 'axes'],
    ['time-series', 'axes'],
    ['live', 'integration'],
    ['divergent-forecast', 'business'],
  ]) {
    const group = groups.find((entry) => entry.id === category);
    const item = group?.items.find((entry) => entry.id === id);
    expect(item, id).toBeDefined();
    expect(
      readPlaygroundRoute(new URL(item?.url ?? '/', 'https://example.test').search).example?.id,
      id,
    ).toBe(id);
  }
  expect(items.filter((item) => item.active).map((item) => item.id)).toEqual(['time-line']);
});

it('preserves every consolidated chart URL and its initial option across code navigation', () => {
  for (const [previousId, canonicalId] of Object.entries(chartConsolidations)) {
    const route = readPlaygroundRoute(`?package=charts&sample=${previousId}&tab=code`);
    expect(route.status).toBe('charts');
    if (route.status !== 'charts') throw new Error('Expected a chart route');
    expect(route.example.id, previousId).toBe(canonicalId);
    expect(route.initialPreset, previousId).toBe(previousId);
    expect(route.tab).toBe('code');
    const url = createPlaygroundUrl('https://example.test/', route);
    expect(url.searchParams.get('sample')).toBe(previousId);
    expect(readPlaygroundRoute(url.search)).toEqual(route);

    const canonical = getPlaygroundRoute(chartsPackage, canonicalId);
    const canonicalUrl = createPlaygroundUrl(url.href, canonical);
    expect(canonicalUrl.searchParams.get('sample')).toBe(canonicalId);
    expect(canonicalUrl.searchParams.has('tab')).toBe(false);
    expect(canonical).not.toHaveProperty('initialPreset');
  }
});

it('accepts only a preset belonging to the selected canonical chart', () => {
  const route = getPlaygroundRoute(chartsPackage, 'bar');
  if (route.status !== 'charts') throw new Error('Expected a chart route');
  for (const initialPreset of ['pie', 'constructor', 'toString', '__proto__']) {
    const url = createPlaygroundUrl('https://example.test/', { ...route, initialPreset });
    expect(url.searchParams.get('sample')).toBe('bar');
  }
  for (const sample of ['constructor', 'toString', '__proto__', 'unknown']) {
    const fallback = getPlaygroundRoute(chartsPackage, sample);
    expect(fallback.example?.id).toBe('getting-started');
    expect(fallback).not.toHaveProperty('initialPreset');
  }
});

for (const [playground, examples, categories] of [
  [chartsPackage, chartCatalog, chartCategories],
  [dataGridPackage, gridCatalog, gridCategories],
] as const) {
  it(`${playground.id}: separates documents from examples while preserving routes and counts`, () => {
    const getExampleUrl = (id: string) =>
      createPlaygroundUrl('https://example.test/', getPlaygroundRoute(playground, id)).href;
    const model = buildNavigationModel({
      playground,
      examples,
      categories,
      currentId: 'api',
      isApi: true,
      getExampleUrl,
    });
    expect(model.currentCategoryLabel).toBe('문서');
    expect(model.exampleCount).toBe(examples.filter((entry) => entry.kind !== 'guide').length);
    const docs = model.groups.find((group) => group.type === 'docs');
    expect(docs?.items.map((item) => item.title)).toEqual(['시작하기', 'API']);
    const api = docs?.items.find((item) => item.id === 'api');
    expect(api?.active).toBe(true);
    expect(readPlaygroundRoute(new URL(api?.url ?? '').search).status).toBe('api');
    const samples = model.groups.find((group) => group.type === 'examples');
    for (const item of samples?.categories.flatMap((category) => category.items) ?? [])
      expect(item.api).toEqual(
        exampleApiLinks(playground.id, item.id).map((reference) => reference.label),
      );
    expect(
      samples?.categories
        .flatMap((category) => category.items)
        .some((item) => ['api', 'getting-started'].includes(item.id)),
    ).toBe(false);
    const started = readPlaygroundRoute(new URL(getExampleUrl('getting-started')).search);
    expect(started.example?.id).toBe('getting-started');
    const sample = examples.find((entry) => entry.kind !== 'guide');
    const active = buildNavigationModel({
      playground,
      examples,
      categories,
      currentId: sample?.id ?? '',
      isApi: false,
      getExampleUrl,
    });
    expect(
      active.groups
        .flatMap((group) =>
          group.type === 'docs'
            ? group.items
            : group.categories.flatMap((category) => category.items),
        )
        .filter((item) => item.active)
        .map((item) => item.id),
    ).toEqual([sample?.id]);
  });
}
