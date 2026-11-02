import { useOwpTranslation } from '@owp/components/hooks';
import { lazy, Suspense } from 'react';
import { ApiIndexList } from '../../shared/ui/ApiIndexList';
import { WorkspaceHeading } from '../../shared/ui/WorkspaceHeading';
import { loadPublicApi } from './loader';
import { displayPublicDescription } from './descriptions';
import { publicApiSearchText } from './roles';
import {
  isPublicApiListEntry,
  publicApiGroups,
  publicApiPackageIds,
  publicApiSampleId,
} from './types';
import type { PublicApiPackageData, PublicApiPackageId } from './types';
import { PublicApiEntry } from './PublicApiEntry';
import { publicApiKindLabels } from './kind-labels';
import '../../playgrounds/components/api/styles.css';
import './styles.css';

export function PublicApiPackageView({
  data,
  symbol,
}: {
  readonly data: PublicApiPackageData;
  readonly symbol: string | null;
}) {
  const { t, i18n } = useOwpTranslation();
  const entry = data.entries.find((entry) => entry.id === symbol);
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
          <PublicApiEntry key={entry.id} entry={entry} />
        ) : (
          <p role="status">{t('공개 API 항목을 찾을 수 없습니다.')}</p>
        )
      ) : (
        <ApiIndexList
          groups={publicApiGroups}
          items={data.entries.filter(isPublicApiListEntry).map((item) => ({
            id: item.id,
            name: item.label ?? item.name,
            description: displayPublicDescription(item, (key, values) => t(key, values)),
            kind: publicApiKindLabels[item.kind],
            group: item.group,
            href: `?${new URLSearchParams({ package: data.id, sample: publicApiSampleId(item.id), lang: i18n.language })}`,
            searchTerms: [publicApiSearchText(item)],
          }))}
        />
      )}
    </section>
  );
}

const packages = Object.fromEntries(
  publicApiPackageIds.map((id) => [
    id,
    lazy(async () => {
      const data = await loadPublicApi(id);
      return {
        default: ({ symbol }: { readonly symbol: string | null }) => (
          <PublicApiPackageView data={data} symbol={symbol} />
        ),
      };
    }),
  ]),
);

export function PublicApiWorkspace({
  packageId,
  symbol,
}: {
  readonly packageId: PublicApiPackageId;
  readonly symbol: string | null;
}) {
  const { t } = useOwpTranslation();
  const Package = packages[packageId];
  if (!Package) throw new RangeError(`Unknown public API package: ${packageId}`);
  return (
    <Suspense fallback={<div role="status">{t('공개 API를 불러오는 중…')}</div>}>
      <Package symbol={symbol} />
    </Suspense>
  );
}
