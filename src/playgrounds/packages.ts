import chartsManifest from '@owp/charts/package.json' with { type: 'json' };
import dataGridManifest from '@owp/datagrid/package.json' with { type: 'json' };
import coreManifest from '@owp/core/package.json' with { type: 'json' };
import { z } from 'zod';

export const playgroundPackageIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);

export const dataGridPackage = {
  id: 'datagrid',
  title: 'owp/datagrid',
  name: '@owp/datagrid',
  version: dataGridManifest.version,
  status: 'ready',
  referencePackages: [],
} as const;

export const chartsPackage = {
  id: 'charts',
  title: 'owp/charts',
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

export const corePackage = {
  id: 'core',
  title: 'owp/core',
  name: '@owp/core',
  version: coreManifest.version,
  status: 'ready',
  referencePackages: [],
} as const;

/** Playground와 Knowledge 검증을 마친 패키지만 이 목록에 등록합니다. */
export const completedPlaygroundPackages = [dataGridPackage, chartsPackage, corePackage] as const;

const planned = <T extends string>(id: T) =>
  ({ id, title: `owp/${id}`, name: `@owp/${id}`, version: null, status: 'planned' }) as const;

export const packageCatalog = [
  ...completedPlaygroundPackages,
  planned('components'),
  planned('date-picker'),
  planned('excel'),
  planned('pdf'),
  planned('theme'),
  planned('utils'),
  planned('tailwind-config'),
] as const;

export function referencePackagesFor(packageId: string): readonly string[] {
  return (
    completedPlaygroundPackages.find((entry) => entry.id === packageId)?.referencePackages ?? []
  );
}

export function apiPackageIdFor(packageName: string): string {
  return (
    packageCatalog.find((entry) => entry.name === packageName)?.id ??
    completedPlaygroundPackages.find((entry) =>
      entry.referencePackages.some((name) => name === packageName),
    )?.id ??
    'charts'
  );
}
