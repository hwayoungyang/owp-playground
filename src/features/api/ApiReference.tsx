import { PlaygroundLink } from '../../shared/ui/PlaygroundLink';
import { useOwpTranslation } from '@owp/components/hooks';
import { Alert, Button, TextField } from '@mui/material';
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { ApiDetail } from './ApiDetail';
import { packageRecords, recordsById } from './model/knowledge';
import { apiHref } from './model/links';
import { matchesApiQuery } from './model/search';
import './styles.css';

const kinds = [
  ['property', 'Props'],
  ['event', 'Events'],
  ['method', 'Methods'],
  ['component', 'Components'],
  ['function', 'Utilities'],
  ['constant', 'Constants'],
  ['type', 'Types'],
  ['guide', 'Guides'],
] as const;
const pageSize = 40;

export function ApiReference({
  packageId,
  symbol,
}: {
  readonly packageId: string;
  readonly symbol: string | null;
}) {
  const { t } = useOwpTranslation();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('property');
  const [page, setPage] = useState(0);
  const records = useMemo(() => {
    const main = packageId === 'datagrid' ? 'OwpDataGridProps' : 'ChartFrameProps';
    const order = [main, 'OwpDataGridColumn', 'OwpDataGridApi', 'Guides'];
    const rank = (owner: string) => {
      const index = order.indexOf(owner);
      return index < 0 ? order.length : index;
    };
    return [...packageRecords(packageId)].sort(
      (left, right) =>
        rank(left.owner) - rank(right.owner) ||
        Number(Boolean(left.path)) - Number(Boolean(right.path)) ||
        left.id.localeCompare(right.id),
    );
  }, [packageId]);
  const selected = symbol
    ? records.find((record) => record.id === symbol)
    : recordsById.get(
        packageId === 'datagrid' ? '@owp/datagrid:OwpDataGridProps' : '@owp/charts:ChartFrameProps',
      );
  const filtered = useMemo(() => {
    return records.filter(
      (record) => (!kind || record.kind === kind) && matchesApiQuery(record, query),
    );
  }, [records, query, kind]);
  const lastPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
  const activePage = Math.min(page, lastPage);
  const shown = filtered.slice(activePage * pageSize, (activePage + 1) * pageSize);
  return (
    <section className="workspace api-workspace" aria-label="API">
      <div className="workspace-heading">
        <h1>API</h1>
        <p>{t('공개 API 타입·동작·사용 예제 확인 가능.')}</p>
      </div>
      <div className="api-layout">
        <details
          className="api-navigation"
          open={typeof window === 'undefined' || window.matchMedia('(min-width: 1101px)').matches}
        >
          <summary>{t('API 검색·목록')}</summary>
          <div className="api-search-controls">
            <TextField
              size="small"
              label={t('API 이름 또는 설명 검색')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
            />
            <label>
              {t('항목 유형')}
              <span className="api-kind-select">
                <select
                  aria-label={t('항목 유형')}
                  value={kind}
                  onChange={(event) => {
                    setKind(event.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">{t('전체')}</option>
                  {kinds.map(([value, label]) => (
                    <option key={value} value={value}>
                      {t(label)}
                    </option>
                  ))}
                </select>
                <CaretDownIcon className="api-kind-icon" size={14} aria-hidden />
              </span>
            </label>
          </div>
          <p className="api-result-count" role="status">
            {t('검색 결과 {{count}}개', { count: filtered.length })}
          </p>
          <nav className="api-result-list" aria-label={t('API 항목')}>
            {shown.map((record) => (
              <PlaygroundLink
                key={record.id}
                href={apiHref(packageId, record.id)}
                aria-current={selected?.id === record.id ? 'page' : undefined}
              >
                <span>
                  <code>{record.kind === 'guide' ? record.name : record.path || record.name}</code>
                  <small>{record.owner === 'Guides' ? t('Guides') : record.owner}</small>
                </span>
                {selected?.id === record.id && <CheckIcon size={14} aria-hidden />}
              </PlaygroundLink>
            ))}
            {filtered.length === 0 && <p>{t('일치하는 API 항목 없음')}</p>}
          </nav>
          <div className="api-pagination">
            <Button
              size="small"
              disabled={activePage === 0}
              onClick={() => setPage(activePage - 1)}
            >
              {t('이전')}
            </Button>
            <span>
              {activePage + 1} / {lastPage + 1}
            </span>
            <Button
              size="small"
              disabled={activePage === lastPage}
              onClick={() => setPage(activePage + 1)}
            >
              {t('다음')}
            </Button>
          </div>
        </details>
        {selected ? (
          <ApiDetail record={selected} focus={Boolean(symbol)} />
        ) : (
          <Alert severity="info">{t('API를 찾을 수 없음. 이름으로 검색 가능.')}</Alert>
        )}
      </div>
    </section>
  );
}
