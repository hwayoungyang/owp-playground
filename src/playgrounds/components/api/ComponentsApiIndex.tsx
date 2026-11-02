import { useOwpTranslation } from '@owp/components/hooks';
import { Button, TextField } from '@mui/material';
import { useId, useState } from 'react';
import { PlaygroundLink } from '../../../shared/ui/PlaygroundLink';
import { formatApiDescription } from '../../../shared/i18n/reference-copy';
import { componentsApiGroups, componentsApiHref, filterComponentsApiEntries } from './navigation';
import type { ComponentsApiEntry } from './types';

export function ComponentsApiIndex({
  entries,
}: {
  readonly entries: readonly ComponentsApiEntry[];
}) {
  const { t, i18n } = useOwpTranslation();
  const [search, setSearch] = useState('');
  const searchId = useId();
  const filtered = filterComponentsApiEntries(entries, search);
  return (
    <>
      <div className="components-api-search">
        <TextField
          id={searchId}
          label={t('API 검색')}
          placeholder={t('이름, 설명 또는 import 경로 검색')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          fullWidth
          slotProps={{ htmlInput: { 'aria-describedby': `${searchId}-count` } }}
        />
        {search && <Button onClick={() => setSearch('')}>{t('검색 지우기')}</Button>}
      </div>
      <p id={`${searchId}-count`} className="components-api-meta" role="status">
        {t('전체 {{total}}개 중 {{count}}개 API', {
          total: entries.length,
          count: filtered.length,
        })}
      </p>
      {filtered.length === 0 && (
        <p>{t('검색 결과가 없습니다. 검색어를 변경하거나 지워 주세요.')}</p>
      )}
      <div className="components-api-index">
        {componentsApiGroups.map((group) => {
          const members = filtered.filter((entry) => entry.group === group.id);
          if (members.length === 0) return null;
          return (
            <section key={group.id} aria-labelledby={`components-api-group-${group.id}`}>
              <h2 id={`components-api-group-${group.id}`}>
                {group.label} <span className="components-api-meta">({members.length})</span>
              </h2>
              <ul className="components-api-index-list">
                {members.map((entry) => (
                  <li key={entry.id}>
                    <PlaygroundLink href={componentsApiHref(entry.id, i18n.language)}>
                      <code>{entry.name}</code>
                    </PlaygroundLink>
                    {entry.description && <p>{formatApiDescription(entry.description)}</p>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
