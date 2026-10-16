import chartsManifest from '@owp/charts/package.json' with { type: 'json' };
import dataGridManifest from '@owp/datagrid/package.json' with { type: 'json' };
import { z } from 'zod';
import { type ChartCatalogEntry, findChartEntry } from './charts/catalog.ts';
import { findGridEntry, type GridCatalogEntry } from './datagrid/catalog.ts';

export const dataGridPackage = {
  id: 'datagrid',
  title: 'OwpDataGrid',
  name: '@owp/datagrid',
  version: dataGridManifest.version,
  status: 'ready',
} as const;

export const chartsPackage = {
  id: 'charts',
  title: 'OwpCharts',
  name: '@owp/charts',
  version: chartsManifest.version,
  status: 'ready',
} as const;

const planned = <T extends string>(id: T, title: string) =>
  ({ id, title, name: `@owp/${id}`, version: null, status: 'planned' }) as const;

export const packageCatalog = [
  dataGridPackage,
  chartsPackage,
  planned('components', 'OwpComponents'),
  planned('date-picker', 'OwpDatePicker'),
  planned('core', 'OwpCore'),
  planned('excel', 'OwpExcel'),
  planned('pdf', 'OwpPdf'),
  planned('theme', 'OwpTheme'),
  planned('tailwind-config', 'OwpTailwindConfig'),
] as const;

export type PlaygroundPackage = (typeof packageCatalog)[number];
type PlannedPackage = Exclude<PlaygroundPackage, typeof dataGridPackage | typeof chartsPackage>;
export type PlaygroundRoute =
  | {
      readonly status: 'charts';
      readonly playground: typeof chartsPackage;
      readonly example: ChartCatalogEntry;
    }
  | {
      readonly status: 'ready';
      readonly playground: typeof dataGridPackage;
      readonly example: GridCatalogEntry;
    }
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
  if (playground.id === 'charts') {
    return { status: 'charts', playground, example: findChartEntry(exampleId) };
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
  return getPlaygroundRoute(playground, parameters.get('sample'));
}

export function createPlaygroundUrl(currentUrl: string, route: PlaygroundRoute): URL {
  const url = new URL(currentUrl);
  url.searchParams.set('package', route.playground.id);
  if (route.example) url.searchParams.set('sample', route.example.id);
  else url.searchParams.delete('sample');
  return url;
}
