import publicApiIndex from 'virtual:public-api/index';
import {
  createPlaygroundUrl,
  getPlaygroundRoute,
  packageCatalog,
} from '../../playgrounds/registry';
import { gridAliases } from '../../playgrounds/datagrid/catalog';
import { selectedChartExample } from '../../playgrounds/charts/model/variants';
import { publicApiSymbol, isPublicApiListEntry } from '../../features/public-api/types';
import { publicApiKindLabels } from '../../features/public-api/kind-labels';
import type { RecentVisit } from './recent-visits';

export function resolveRecentNavigation({
  visit,
  baseUrl,
  language,
}: {
  readonly visit: RecentVisit;
  readonly baseUrl: string;
  readonly language: string;
}) {
  const playground = packageCatalog.find((entry) => entry.id === visit.packageId);
  if (!playground) return null;
  const route = getPlaygroundRoute(playground, visit.id);
  const example = route.example;
  if (!example) return null;
  const symbol = publicApiSymbol(visit.id);
  const entry = symbol
    ? publicApiIndex
        .find((item) => item.id === playground.id)
        ?.entries.find((item) => item.id === symbol && isPublicApiListEntry(item))
    : undefined;
  if (symbol && !entry) return null;
  if (
    !symbol &&
    example.id !== visit.id &&
    gridAliases[visit.id] !== example.id &&
    !(route.status === 'charts' && route.initialPreset === visit.id)
  )
    return null;
  const metadata =
    route.status === 'charts' && route.example.kind === 'chart'
      ? selectedChartExample(route.example, route.initialPreset)
      : example;
  const url = createPlaygroundUrl(baseUrl, route);
  url.searchParams.set('lang', language === 'en' ? 'en' : 'ko');
  return {
    route,
    href: url.href,
    packageTitle: playground.title,
    title: entry ? (entry.label ?? entry.name) : metadata.title,
    kind: entry
      ? publicApiKindLabels[entry.kind]
      : 'kind' in metadata && metadata.kind === 'guide'
        ? '가이드'
        : metadata.id === 'exports' || metadata.id === 'api'
          ? 'API'
          : '예제',
  };
}
