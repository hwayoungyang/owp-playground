import { useOwpTranslation } from '@owp/components/hooks';
import { useId, useState } from 'react';
import { ApiDescription, RecordLink } from './ApiRecordContent';
import type { ApiRecord } from './model/knowledge';
import { filterRelatedRecords } from './model/presentation';

export function ApiRelatedRecords({ records }: { readonly records: readonly ApiRecord[] }) {
  const { t } = useOwpTranslation();
  const [query, setQuery] = useState('');
  const inputId = useId();
  const filtered = filterRelatedRecords(records, query);
  const groups = [
    { label: '가이드', records: filtered.filter((record) => record.kind === 'guide') },
    { label: '관련 타입', records: filtered.filter((record) => record.kind !== 'guide') },
  ];
  return (
    <section className="api-related" aria-labelledby="api-related-heading">
      <h3 id="api-related-heading">{t('관련 설명·타입')}</h3>
      <div className="api-related-search">
        <label htmlFor={inputId}>{t('관련 항목 검색')}</label>
        <div>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}>
              {t('검색 지우기')}
            </button>
          )}
        </div>
        <p role="status">{t('검색 결과 {{count}}개', { count: filtered.length })}</p>
      </div>
      {filtered.length === 0 && <p className="api-description">{t('일치하는 API 항목 없음')}</p>}
      {groups.map(
        (group) =>
          group.records.length > 0 && (
            <details key={group.label} className="api-related-group" open>
              <summary>
                {t(group.label)} <span>{group.records.length}</span>
              </summary>
              <ul>
                {group.records.map((record) => (
                  <li key={record.id}>
                    <RecordLink record={record} qualified />
                    <ApiDescription record={record} />
                  </li>
                ))}
              </ul>
            </details>
          ),
      )}
    </section>
  );
}
