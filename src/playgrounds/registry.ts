import { z } from 'zod';
import {
  type chartsPackage,
  corePackage,
  type componentsPackage,
  dataGridPackage,
  packageCatalog,
  supportsApiReference,
} from './packages';
export {
  chartsPackage,
  corePackage,
  componentsPackage,
  dataGridPackage,
  packageCatalog,
} from './packages';
import { type ComponentsCatalogEntry, findComponentsEntry } from './components/catalog';
import { type CoreCatalogEntry, findCoreEntry } from './core/catalog';
import { type ChartCatalogEntry, findChartEntry } from './charts/catalog.ts';
import { chartConsolidations } from './charts/model/consolidations.ts';
import { findGridEntry, type GridCatalogEntry } from './datagrid/catalog.ts';
import { type CodeLocation, readCodeLocation } from '../features/code/code-location';
import { inferChartVariantFromCode } from './charts/model/variants';
import { isPublicApiPackage, publicApiSymbol } from '../features/public-api/types';
import type { PublicApiPackageId } from '../features/public-api/types';
import { hasStandaloneGuide, packageGuideEntry } from './introductions';

type CodeRouteState = {
  readonly tab?: 'code' | 'props' | 'params' | 'returns' | 'type';
  readonly codeTarget?: CodeLocation;
};

export type PlaygroundPackage = (typeof packageCatalog)[number];
type ApiPackage = Extract<
  PlaygroundPackage,
  { readonly status: 'ready' } | { readonly status: 'available' }
>;
type PlannedPackage = Extract<PlaygroundPackage, { readonly status: 'planned' }>;
export function apiEntry(playground: ApiPackage) {
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
      readonly status: 'package-guide';
      readonly playground: ApiPackage;
      readonly example: ReturnType<typeof packageGuideEntry>;
    }
  | {
      readonly status: 'exports';
      readonly playground: PlaygroundPackage;
      readonly packageId: PublicApiPackageId;
      readonly symbol: string | null;
      readonly tab?: 'example' | 'code' | 'props' | 'params' | 'returns' | 'type';
      readonly example: {
        readonly id: string;
        readonly title: string;
        readonly package: string;
        readonly category: string;
        readonly description: string;
        readonly api: readonly string[];
        readonly source: string;
      };
    }
  | ({
      readonly status: 'components';
      readonly playground: typeof componentsPackage;
      readonly example: ComponentsCatalogEntry;
    } & CodeRouteState)
  | {
      readonly status: 'api';
      readonly playground: ApiPackage;
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
  if (
    supportsApiReference(playground) &&
    hasStandaloneGuide(playground.id) &&
    (!exampleId || exampleId === 'getting-started')
  )
    return { status: 'package-guide', playground, example: packageGuideEntry(playground) };
  const symbol = exampleId && publicApiSymbol(exampleId);
  if (
    isPublicApiPackage(playground.id) &&
    (symbol ||
      exampleId === 'exports' ||
      (playground.status === 'available' && playground.id !== 'components'))
  ) {
    return {
      status: 'exports',
      playground,
      packageId: playground.id,
      symbol: symbol || null,
      example: {
        id: symbol ? `export:${symbol}` : 'exports',
        title: symbol ? (symbol.split(':').at(-1) ?? symbol) : '공개 API',
        package: playground.name,
        category: 'reference',
        description: '',
        api: [],
        source: '',
      },
    };
  }
  if (exampleId === 'api' && supportsApiReference(playground))
    return { status: 'api', playground, example: apiEntry(playground), symbol: null };
  if (playground.id === 'components')
    return { status: 'components', playground, example: findComponentsEntry(exampleId) };
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
    case 'available':
      throw new RangeError(`Unsupported available package: ${playground.id}`);
    default:
      return playground;
  }
}

export function readPlaygroundRoute(search: string): PlaygroundRoute {
  const parameters = new URLSearchParams(search);
  const packageId = packageIdSchema.safeParse(parameters.get('package')?.replace(/^@owp\//, ''));
  const fallback =
    !parameters.has('package') && parameters.has('sample') ? dataGridPackage : corePackage;
  const playground = packageId.success
    ? (packageCatalog.find((entry) => entry.id === packageId.data) ?? fallback)
    : fallback;
  if (parameters.get('view') === 'api' && supportsApiReference(playground))
    return {
      status: 'api',
      playground,
      example: apiEntry(playground),
      symbol: parameters.get('symbol'),
    };
  const route = getPlaygroundRoute(playground, parameters.get('sample'));
  const tab = parameters.get('tab');
  if (
    route.status === 'exports' &&
    (tab === 'example' ||
      tab === 'code' ||
      tab === 'props' ||
      tab === 'params' ||
      tab === 'returns' ||
      tab === 'type')
  )
    return { ...route, tab };
  if (
    (route.status === 'ready' ||
      route.status === 'charts' ||
      route.status === 'core' ||
      route.status === 'components') &&
    route.example.kind !== 'guide' &&
    (tab === 'props' || tab === 'params' || tab === 'returns' || tab === 'type')
  )
    return { ...route, tab };
  if (
    (route.status === 'ready' ||
      route.status === 'charts' ||
      route.status === 'core' ||
      route.status === 'components') &&
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
  if (route.status === 'exports' && route.tab) url.searchParams.set('tab', route.tab);
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
    (route.status === 'ready' ||
      route.status === 'charts' ||
      route.status === 'core' ||
      route.status === 'components') &&
    route.tab
  ) {
    url.searchParams.set('tab', route.tab);
    if (route.codeTarget) {
      url.searchParams.set('file', route.codeTarget.file);
      url.searchParams.set('line', String(route.codeTarget.line));
      url.searchParams.set('endLine', String(route.codeTarget.endLine));
    }
  }
  return url;
}
