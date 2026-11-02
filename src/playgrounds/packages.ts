import chartsManifest from '@owp/charts/package.json' with { type: 'json' };
import dataGridManifest from '@owp/datagrid/package.json' with { type: 'json' };
import coreManifest from '@owp/core/package.json' with { type: 'json' };
import componentsManifest from '@owp/components/package.json' with { type: 'json' };
import datePickerManifest from '@owp/date-picker/package.json' with { type: 'json' };
import excelManifest from '@owp/excel/package.json' with { type: 'json' };
import pdfManifest from '@owp/pdf/package.json' with { type: 'json' };
import themeManifest from '@owp/theme/package.json' with { type: 'json' };
import utilsManifest from '@owp/utils/package.json' with { type: 'json' };
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

export const componentsPackage = {
  id: 'components',
  title: 'owp/components',
  name: '@owp/components',
  version: componentsManifest.version,
  status: 'available',
  referencePackages: [],
} as const;

const planned = <T extends string>(id: T) =>
  ({ id, title: `owp/${id}`, name: `@owp/${id}`, version: null, status: 'planned' }) as const;

const available = <T extends string>(id: T, version: string) =>
  ({ id, title: `owp/${id}`, name: `@owp/${id}`, version, status: 'available' }) as const;

export const packageCatalog = [
  ...completedPlaygroundPackages,
  componentsPackage,
  available('date-picker', datePickerManifest.version),
  available('excel', excelManifest.version),
  available('pdf', pdfManifest.version),
  available('theme', themeManifest.version),
  available('utils', utilsManifest.version),
  planned('tailwind-config'),
] as const;

/** 설치본의 공개 API와 가이드를 검증해 Knowledge로 제공하는 패키지입니다. */
export const knowledgePackages = packageCatalog.flatMap((entry) =>
  entry.status === 'planned' || !['datagrid', 'charts', 'core', 'components', 'date-picker', 'excel', 'pdf', 'theme', 'utils'].includes(entry.id)
    ? [] : [{ ...entry, referencePackages: referencePackagesFor(entry.id) }],
);

export function supportsApiReference(
  playground: (typeof packageCatalog)[number],
): playground is Extract<
  (typeof packageCatalog)[number],
  { readonly status: 'ready' } | { readonly status: 'available' }
> {
  return playground.status === 'ready' || playground.status === 'available';
}

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
