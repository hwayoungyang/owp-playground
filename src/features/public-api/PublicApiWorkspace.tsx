import { useOwpTranslation } from '@owp/components/hooks';
import { TextField } from '@mui/material';
import { lazy, Suspense, useState } from 'react';
import { PlaygroundLink } from '../../shared/ui/PlaygroundLink';
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
import { PublicApiEntry, publicApiKindLabels } from './PublicApiEntry';
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
  const [search, setSearch] = useState('');
  const entry = data.entries.find((entry) => entry.id === symbol);
  const title = symbol
    ? (entry?.label ?? entry?.name ?? t('API를 찾을 수 없습니다.'))
    : t('공개 API');
  const query = search.trim().toLocaleLowerCase();
  const filtered = data.entries
    .filter(isPublicApiListEntry)
    .filter((entry) => publicApiSearchText(entry).toLocaleLowerCase().includes(query));
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
        <>
          <TextField
            fullWidth
            size="small"
            label={t('공개 API 검색')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="components-api-index">
            {publicApiGroups.map((group) => {
              const entries = filtered.filter((entry) => entry.group === group.id);
              return entries.length > 0 ? (
                <section key={group.id}>
                  <h2>{t(group.label)}</h2>
                  <ul className="components-api-index-list">
                    {entries.map((entry) => (
                      <li key={entry.id}>
                        <PlaygroundLink
                          href={`?${new URLSearchParams({ package: data.id, sample: publicApiSampleId(entry.id), lang: i18n.language })}`}
                        >
                          {entry.label ?? entry.name}
                        </PlaygroundLink>
                        <p>{displayPublicDescription(entry, (key, values) => t(key, values))}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null;
            })}
          </div>
          {!filtered.length && <p role="status">{t('검색 결과가 없습니다.')}</p>}
        </>
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
