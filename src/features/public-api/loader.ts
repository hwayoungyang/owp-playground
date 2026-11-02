import type { PublicApiEntry, PublicApiEntryLoaders, PublicApiPackageId } from './types';

const loaders = {
  components: () => import('virtual:public-api/components/entries'),
  core: () => import('virtual:public-api/core/entries'),
  charts: () => import('virtual:public-api/charts/entries'),
  datagrid: () => import('virtual:public-api/datagrid/entries'),
  'date-picker': () => import('virtual:public-api/date-picker/entries'),
  excel: () => import('virtual:public-api/excel/entries'),
  pdf: () => import('virtual:public-api/pdf/entries'),
  theme: () => import('virtual:public-api/theme/entries'),
  utils: () => import('virtual:public-api/utils/entries'),
} satisfies Record<PublicApiPackageId, () => Promise<{ readonly default: PublicApiEntryLoaders }>>;

const entries = new Map<string, Promise<PublicApiEntry | undefined>>();

export function loadPublicApiEntry(
  id: PublicApiPackageId,
  symbol: string,
): Promise<PublicApiEntry | undefined> {
  const key = `${id}/${symbol}`;
  const existing = entries.get(key);
  if (existing) return existing;
  const request = loaders[id]().then((module) => module.default[symbol]?.());
  entries.set(key, request);
  return request;
}
