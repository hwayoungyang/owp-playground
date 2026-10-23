import chartsManifest from '@owp/charts/package.json' with { type: 'json' };
import dataGridManifest from '@owp/datagrid/package.json' with { type: 'json' };
import { z } from 'zod';

export const playgroundPackageIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);

export const dataGridPackage = {
  id: 'datagrid',
  title: 'OwpDataGrid',
  name: '@owp/datagrid',
  version: dataGridManifest.version,
  status: 'ready',
  referencePackages: [],
} as const;

export const chartsPackage = {
  id: 'charts',
  title: 'OwpCharts',
  name: '@owp/charts',
  version: chartsManifest.version,
  status: 'ready',
  referencePackages: [
    'chart.js',
    'react-chartjs-2',
    'chartjs-plugin-annotation',
    'chartjs-plugin-datalabels',
  ],
} as const;

/** Playground와 Knowledge 검증을 마친 패키지만 이 목록에 등록합니다. */
export const completedPlaygroundPackages = [dataGridPackage, chartsPackage] as const;

const planned = <T extends string>(id: T, title: string) =>
  ({ id, title, name: `@owp/${id}`, version: null, status: 'planned' }) as const;

export const packageCatalog = [
  ...completedPlaygroundPackages,
  planned('components', 'OwpComponents'),
  planned('date-picker', 'OwpDatePicker'),
  planned('core', 'OwpCore'),
  planned('excel', 'OwpExcel'),
  planned('pdf', 'OwpPdf'),
  planned('theme', 'OwpTheme'),
  planned('utils', 'OwpUtils'),
  planned('tailwind-config', 'OwpTailwindConfig'),
] as const;

export function referencePackagesFor(packageId: string): readonly string[] {
  return (
    completedPlaygroundPackages.find((entry) => entry.id === packageId)?.referencePackages ?? []
  );
}
