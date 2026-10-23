import { z } from 'zod';
import { type chartsPackage, type corePackage, dataGridPackage, packageCatalog } from './packages';
export { chartsPackage, corePackage, dataGridPackage, packageCatalog } from './packages';
import { type CoreCatalogEntry, findCoreEntry } from './core/catalog';
import { type ChartCatalogEntry, findChartEntry } from './charts/catalog.ts';
import { chartConsolidations } from './charts/model/consolidations.ts';
import { findGridEntry, type GridCatalogEntry } from './datagrid/catalog.ts';
import { type CodeLocation, readCodeLocation } from '../features/code/code-location';
import { inferChartVariantFromCode } from './charts/model/variants';

type CodeRouteState = { readonly tab?: 'code'; readonly codeTarget?: CodeLocation };

export type PlaygroundPackage = (typeof packageCatalog)[number];
type ReadyPackage = Extract<PlaygroundPackage, { readonly status: 'ready' }>;
type PlannedPackage = Exclude<PlaygroundPackage, ReadyPackage>;
export function apiEntry(playground: ReadyPackage) {
  return {
    id: 'api',
    kind: 'reference',
    title: 'API',
    package: playground.name,
    category: 'docs',
    description: '공개 API의 타입·동작·사용법과 관련 예제 코드',
    api: [],
    source: '',
  } as const;
}
export type PlaygroundRoute =
  | {
      readonly status: 'api';
      readonly playground: ReadyPackage;
      readonly example: ReturnType<typeof apiEntry>;
      readonly symbol: string | null;
    }
  | ({
      readonly status: 'core';
      readonly playground: typeof corePackage;
      readonly example: CoreCatalogEntry;
    } & CodeRouteState)
  | ({
      readonly status: 'charts';
      readonly playground: typeof chartsPackage;
      readonly example: ChartCatalogEntry;
      readonly initialPreset?: string;
    } & CodeRouteState)
  | ({
      readonly status: 'ready';
      readonly playground: typeof dataGridPackage;
      readonly example: GridCatalogEntry;
    } & CodeRouteState)
  | {
      readonly status: 'planned';
      readonly playground: PlannedPackage;
      readonly example: null;
    };

const packageIdSchema = z.enum(packageCatalog.map((playground) => playground.id));

export function getPlaygroundRoute(
  playground: PlaygroundPackage,
  exampleId: string | null = null,
): PlaygroundRoute {
  if (exampleId === 'api' && playground.status === 'ready')
    return { status: 'api', playground, example: apiEntry(playground), symbol: null };
  if (playground.id === 'core')
    return { status: 'core', playground, example: findCoreEntry(exampleId) };
  if (playground.id === 'charts') {
    return {
      status: 'charts',
      playground,
      example: findChartEntry(exampleId),
      ...(exampleId && Object.hasOwn(chartConsolidations, exampleId)
        ? { initialPreset: exampleId }
        : {}),
    };
  }
  switch (playground.status) {
    case 'ready':
      return { status: 'ready', playground, example: findGridEntry(exampleId) };
    case 'planned':
      return { status: 'planned', playground, example: null };
    default:
      return playground;
  }
}

export function readPlaygroundRoute(search: string): PlaygroundRoute {
  const parameters = new URLSearchParams(search);
  const packageId = packageIdSchema.safeParse(parameters.get('package')?.replace(/^@owp\//, ''));
  const playground = packageId.success
    ? (packageCatalog.find((entry) => entry.id === packageId.data) ?? dataGridPackage)
    : dataGridPackage;
  if (parameters.get('view') === 'api' && playground.status === 'ready')
    return {
      status: 'api',
      playground,
      example: apiEntry(playground),
      symbol: parameters.get('symbol'),
    };
  const route = getPlaygroundRoute(playground, parameters.get('sample'));
  if (
    (route.status === 'ready' || route.status === 'charts' || route.status === 'core') &&
    parameters.get('tab') === 'code'
  ) {
    const codeTarget = readCodeLocation(parameters, playground.id);
    if (route.status === 'charts' && codeTarget) {
      const selectedId = inferChartVariantFromCode(route.example, codeTarget.file);
      if (selectedId) {
        const { initialPreset: _initialPreset, ...canonical } = route;
        return {
          ...canonical,
          ...(selectedId !== route.example.id ? { initialPreset: selectedId } : {}),
          tab: 'code',
          codeTarget,
        };
      }
    }
    return { ...route, tab: 'code', codeTarget };
  }
  return route;
}

export function createPlaygroundUrl(currentUrl: string, route: PlaygroundRoute): URL {
  const url = new URL(currentUrl);
  url.searchParams.set('package', route.playground.id);
  for (const key of ['tab', 'file', 'line', 'endLine']) url.searchParams.delete(key);
  if (route.status === 'api') {
    url.searchParams.set('view', 'api');
    url.searchParams.delete('sample');
    if (route.symbol) url.searchParams.set('symbol', route.symbol);
    else url.searchParams.delete('symbol');
    return url;
  }
  url.searchParams.delete('view');
  url.searchParams.delete('symbol');
  if (route.example)
    url.searchParams.set(
      'sample',
      route.status === 'charts' &&
        route.initialPreset &&
        Object.hasOwn(chartConsolidations, route.initialPreset) &&
        chartConsolidations[route.initialPreset] === route.example.id
        ? route.initialPreset
        : route.example.id,
    );
  else url.searchParams.delete('sample');
  if (
    (route.status === 'ready' || route.status === 'charts' || route.status === 'core') &&
    route.tab === 'code'
  ) {
    url.searchParams.set('tab', 'code');
    if (route.codeTarget) {
      url.searchParams.set('file', route.codeTarget.file);
      url.searchParams.set('line', String(route.codeTarget.line));
      url.searchParams.set('endLine', String(route.codeTarget.endLine));
    }
  }
  return url;
}
