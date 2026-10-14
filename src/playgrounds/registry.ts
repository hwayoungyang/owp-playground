import { z } from 'zod';
import { findSample, type Sample } from './datagrid/catalog.ts';

export const dataGridPackage = {
  id: 'datagrid',
  title: 'OwpDataGrid',
  name: '@owp/datagrid',
  version: '2.0.10',
  status: 'ready',
} as const;

const planned = <T extends string>(id: T, title: string) =>
  ({ id, title, name: `@owp/${id}`, version: null, status: 'planned' }) as const;

export const packageCatalog = [
  dataGridPackage,
  planned('components', 'OwpComponents'),
  planned('date-picker', 'OwpDatePicker'),
  planned('core', 'OwpCore'),
  planned('charts', 'OwpCharts'),
  planned('excel', 'OwpExcel'),
  planned('pdf', 'OwpPdf'),
  planned('theme', 'OwpTheme'),
  planned('tailwind-config', 'OwpTailwindConfig'),
] as const;

export type PlaygroundPackage = (typeof packageCatalog)[number];
type PlannedPackage = Exclude<PlaygroundPackage, typeof dataGridPackage>;
export type PlaygroundRoute =
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
