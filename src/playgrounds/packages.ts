import chartsManifest from '@owp/charts/package.json' with { type: 'json' };
import dataGridManifest from '@owp/datagrid/package.json' with { type: 'json' };
import coreManifest from '@owp/core/package.json' with { type: 'json' };
import componentsManifest from '@owp/components/package.json' with { type: 'json' };
import datePickerManifest from '@owp/date-picker/package.json' with { type: 'json' };
import excelManifest from '@owp/excel/package.json' with { type: 'json' };
import pdfManifest from '@owp/pdf/package.json' with { type: 'json' };
import themeManifest from '@owp/theme/package.json' with { type: 'json' };
import utilsManifest from '@owp/utils/package.json' with { type: 'json' };
import tailwindManifest from '../../node_modules/@owp/tailwind-config/package.json' with { type: 'json' };
import { knowledgePackageIds } from './knowledge-package-ids.ts';
import { chartsReferencePackages, referencePackagesFor } from './package-contracts.ts';

export {
  chartsReferencePackages,
  playgroundPackageIdSchema,
  referencePackagesFor,
} from './package-contracts.ts';

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
  referencePackages: chartsReferencePackages,
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
  available('tailwind-config', tailwindManifest.version),
] as const;

/** 설치본의 공개 API와 가이드를 검증해 Knowledge로 제공하는 패키지입니다. */
export const knowledgePackages = packageCatalog.flatMap((entry) =>
  !knowledgePackageIds.some((id) => id === entry.id)
    ? []
    : [{ ...entry, referencePackages: referencePackagesFor(entry.id) }],
);

export function supportsApiReference(
  playground: (typeof packageCatalog)[number],
): playground is Exclude<(typeof packageCatalog)[number], { readonly id: 'tailwind-config' }> {
  return playground.id !== 'tailwind-config';
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
