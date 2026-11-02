import { useOwpTranslation } from '@owp/components/hooks';
import { Button, IconButton, InputAdornment, TextField } from '@mui/material';
import { XIcon } from '@phosphor-icons/react';
import { useId, useRef, useState } from 'react';
import { PlaygroundLink } from './PlaygroundLink';
import './api-index-list.css';

export type ApiIndexItem = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly kind: string;
  readonly group: string;
  readonly href: string;
  readonly searchTerms: readonly string[];
};
type ApiIndexGroup = { readonly id: string; readonly label: string };

export function filterApiIndex({
  items,
  query,
  group,
}: {
  readonly items: readonly ApiIndexItem[];
  readonly query: string;
  readonly group: string;
}): readonly ApiIndexItem[] {
  const normalized = query.trim().toLocaleLowerCase();
  return items.filter(
    (item) =>
      (group === 'all' || item.group === group) &&
      item.searchTerms.some((term) => term.toLocaleLowerCase().includes(normalized)),
  );
}

export function ApiIndexList({
  items,
  groups,
}: {
  readonly items: readonly ApiIndexItem[];
  readonly groups: readonly ApiIndexGroup[];
}) {
  const { t } = useOwpTranslation();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const available = groups.filter((entry) => items.some((item) => item.group === entry.id));
  const filtered = filterApiIndex({ items, query, group });
  const clearQuery = () => {
    setQuery('');
    input.current?.focus();
  };
  return (
    <div className="api-index">
      <div className="api-index-controls">
        <TextField
          label={t('공개 API 검색')}
          placeholder={t('이름, 설명 또는 import 경로 검색')}
          value={query}
          inputRef={input}
          onChange={(event) => setQuery(event.target.value)}
          size="small"
          fullWidth
          slotProps={{
            htmlInput: { 'aria-describedby': `${id}-count` },
            input: {
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label={t('검색 지우기')} onClick={clearQuery}>
                    <XIcon size={16} aria-hidden />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
        <div className="api-index-filters" role="group" aria-label={t('API 종류')}>
          {[{ id: 'all', label: '전체' }, ...available].map((entry) => (
            <button
              type="button"
              key={entry.id}
              aria-pressed={group === entry.id}
              onClick={() => setGroup(entry.id)}
            >
              {t(entry.label)}
            </button>
          ))}
        </div>
      </div>
      <p id={`${id}-count`} className="api-index-count" role="status">
        {t('전체 {{total}}개 중 {{count}}개 API', { total: items.length, count: filtered.length })}
      </p>
      <div className="api-index-columns" aria-hidden="true">
        <span>{t('이름')}</span>
        <span>{t('설명')}</span>
        <span>{t('항목 유형')}</span>
      </div>
      <ul className="api-index-list" aria-label={t('공개 API')}>
        {filtered.map((item) => (
          <li key={item.id}>
            <PlaygroundLink className="api-index-row" href={item.href}>
              <code className="api-index-name">{item.name}</code>
              <span className="api-index-description">{item.description || '—'}</span>
              <span className="api-index-kind">{item.kind}</span>
            </PlaygroundLink>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <div className="api-index-empty">
          <p>{t('검색 결과가 없습니다. 검색어를 변경하거나 지워 주세요.')}</p>
          <Button
            onClick={() => {
              setGroup('all');
              clearQuery();
            }}
          >
            {t('검색 지우기')}
          </Button>
        </div>
      )}
    </div>
  );
}
