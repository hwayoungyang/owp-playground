import { useOwpTranslation } from '@owp/components/hooks';
import { lazy, Suspense, use } from 'react';
import publicApiIndex from 'virtual:public-api/index';
import { ApiIndexList } from '../../shared/ui/ApiIndexList';
import { WorkspaceHeading } from '../../shared/ui/WorkspaceHeading';
import { WorkspaceLoading } from '../../shared/ui/WorkspaceLoading';
import { loadPublicApiEntry } from './loader';
import { displayPublicDescription } from './descriptions';
import { publicApiSearchText } from './roles';
import { isPublicApiListEntry, publicApiSampleId } from './types';
import { publicApiNavigationGroup, publicApiNavigationGroups } from './grouping';
import type { PublicApiIndex, PublicApiPackageData, PublicApiPackageId } from './types';
import { publicApiKindLabels } from './kind-labels';
import '../../playgrounds/components/api/styles.css';
import './styles.css';

const loadEntryComponent = () =>
  import('./PublicApiEntry').then((module) => ({ default: module.PublicApiEntry }));
const Entry = lazy(loadEntryComponent);
const Icon = lazy(() =>
  import('./PublicApiIcon').then((module) => ({ default: module.PublicApiIcon })),
);
type PackageViewProps =
  | { readonly data: PublicApiPackageData; readonly symbol: string }
  | { readonly data: PublicApiIndex[number]; readonly symbol: null };

export function PublicApiPackageView({ data, symbol }: PackageViewProps) {
  const { t, i18n } = useOwpTranslation();
  const entry = symbol === null ? undefined : data.entries.find((entry) => entry.id === symbol);
  const title = symbol
    ? (entry?.label ?? entry?.name ?? t('API를 찾을 수 없습니다.'))
    : t('공개 API');
  return (
    <section className="workspace components-api public-api-workspace" aria-label={t('공개 API')}>
      <WorkspaceHeading
        example={{
          id: symbol ?? 'exports',
          title,
          package: `@owp/${data.id}`,
          description: '',
          category: 'reference',
          api: [],
          source: '',
        }}
        packageTitle={`owp/${data.id}`}
        categoryLabel="공개 API"
        metadata={
          entry && (
            <div className="public-api-context">
              <span>{publicApiKindLabels[entry.kind]}</span>
              <code>{entry.modules[0]}</code>
            </div>
          )
        }
      />
      {symbol ? (
        entry ? (
          <Suspense fallback={<WorkspaceLoading label="공개 API를 불러오는 중…" />}>
            <Entry key={entry.id} entry={entry} />
          </Suspense>
        ) : (
          <p role="status">{t('공개 API 항목을 찾을 수 없습니다.')}</p>
        )
      ) : (
        <ApiIndexList
          groups={publicApiNavigationGroups(data.id)}
          items={data.entries.filter(isPublicApiListEntry).map((item) => ({
            id: item.id,
            name: item.label ?? item.name,
            description: displayPublicDescription(item, (key, values) => t(key, values)),
            kind: publicApiKindLabels[item.kind],
            group: publicApiNavigationGroup(item),
            leading:
              publicApiNavigationGroup(item) === 'component-icons' ? (
                <Suspense fallback={null}>
                  <Icon name={item.name} />
                </Suspense>
              ) : undefined,
            href: `?${new URLSearchParams({ package: data.id, sample: publicApiSampleId(item.id), lang: i18n.language })}`,
            searchTerms: [publicApiSearchText(item)],
          }))}
        />
      )}
    </section>
  );
}

const details = new Map<string, Promise<PublicApiPackageData>>();

function detailData(data: PublicApiIndex[number], symbol: string) {
  const key = `${data.id}/${symbol}`;
  const existing = details.get(key);
  if (existing) return existing;
  const request = Promise.all([loadPublicApiEntry(data.id, symbol), loadEntryComponent()]).then(
    ([entry]) => ({ ...data, entries: entry ? [entry] : [], entrypoints: [] }),
  );
  details.set(key, request);
  return request;
}

function PublicApiDetail({
  data,
  symbol,
}: {
  readonly data: PublicApiIndex[number];
  readonly symbol: string;
}) {
  const loaded = use(detailData(data, symbol));
  return <PublicApiPackageView data={loaded} symbol={symbol} />;
}

export function PublicApiWorkspace({
  packageId,
  symbol,
}: {
  readonly packageId: PublicApiPackageId;
  readonly symbol: string | null;
}) {
  const data = publicApiIndex.find((entry) => entry.id === packageId);
  if (!data) throw new RangeError(`Unknown public API package: ${packageId}`);
  if (symbol === null) return <PublicApiPackageView data={data} symbol={null} />;
  return (
    <Suspense fallback={<WorkspaceLoading scope="page" label="공개 API를 불러오는 중…" />}>
      <PublicApiDetail data={data} symbol={symbol} />
    </Suspense>
  );
}
