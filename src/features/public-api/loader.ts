import type { PublicApiPackageData, PublicApiPackageId } from './types';

const loaders = {
  components: () => import('virtual:public-api/components'),
  core: () => import('virtual:public-api/core'),
  charts: () => import('virtual:public-api/charts'),
  datagrid: () => import('virtual:public-api/datagrid'),
  'date-picker': () => import('virtual:public-api/date-picker'),
  excel: () => import('virtual:public-api/excel'),
  pdf: () => import('virtual:public-api/pdf'),
  theme: () => import('virtual:public-api/theme'),
  utils: () => import('virtual:public-api/utils'),
} satisfies Record<PublicApiPackageId, () => Promise<{ readonly default: PublicApiPackageData }>>;

export function loadPublicApi(id: PublicApiPackageId): Promise<PublicApiPackageData> {
  return loaders[id]().then((module) => module.default);
}
