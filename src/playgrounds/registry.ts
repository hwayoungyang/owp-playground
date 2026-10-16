import chartsManifest from '@owp/charts/package.json' with { type: 'json' };
import dataGridManifest from '@owp/datagrid/package.json' with { type: 'json' };
import { z } from 'zod';
import { type ChartSample, findChartSample } from './charts/catalog.ts';
import { findSample, type Sample } from './datagrid/catalog.ts';

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
      readonly sample: ChartSample;
    }
  | {
      readonly status: 'ready';
      readonly playground: typeof dataGridPackage;
      readonly sample: Sample;
    }
  | {
      readonly status: 'planned';
      readonly playground: PlannedPackage;
      readonly sample: null;
    };

const packageIdSchema = z.enum(packageCatalog.map((playground) => playground.id));

export function getPlaygroundRoute(
  playground: PlaygroundPackage,
  sampleId: string | null = null,
): PlaygroundRoute {
  if (playground.id === 'charts') {
    return { status: 'charts', playground, sample: findChartSample(sampleId) };
  }
  switch (playground.status) {
    case 'ready':
      return { status: 'ready', playground, sample: findSample(sampleId) };
    case 'planned':
      return { status: 'planned', playground, sample: null };
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
  if (route.sample) url.searchParams.set('sample', route.sample.id);
  else url.searchParams.delete('sample');
  return url;
}
