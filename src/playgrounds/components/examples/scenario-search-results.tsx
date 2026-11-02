import { useEffect, useMemo, useState } from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import { OwpOptionSelector, OwpSearchFilter, OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

const items = [
  { id: 'A-100', name: '센서 모듈', enabled: true, quantity: 24 },
  { id: 'B-200', name: '제어 보드', enabled: true, quantity: 12 },
  { id: 'C-300', name: '연결 케이블', enabled: false, quantity: 80 },
] as const;
export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [query, setQuery] = useState({ name: '', status: '' });
  const [applied, setApplied] = useState(query);
  const results = useMemo(
    () =>
      items.filter(
        (item) =>
          item.name.includes(applied.name.trim()) &&
          (applied.status === '' || item.enabled === (applied.status === 'active')),
      ),
    [applied],
  );
  useEffect(() => {
    onData({ query, applied, rows: results });
  }, [query, applied, results, onData]);
  return (
    <>
      <ExampleSection
        title="조회할 조건 입력"
        description="조건을 입력한 뒤 검색을 누르면 아래 목록에 반영합니다."
      >
        <OwpSearchFilter
          title={t('검색 조건')}
          onSubmit={() => {
            setApplied(query);
            onRecord('list.search', JSON.stringify(query));
          }}
          onReset={() => {
            const empty = { name: '', status: '' };
            setQuery(empty);
            setApplied(empty);
            onRecord('list.reset', 'all');
          }}
        >
          <TextField
            label={t('항목명')}
            value={query.name}
            onChange={(event) =>
              setQuery((previous) => ({ ...previous, name: event.target.value }))
            }
            size="small"
            sx={{ width: 240, maxWidth: '100%' }}
          />
          <Stack sx={{ width: 240, maxWidth: '100%' }}>
            <OwpOptionSelector
              label={t('사용 여부')}
              value={query.status}
              options={[
                { value: '', label: t('전체') },
                { value: 'active', label: t('사용') },
                { value: 'inactive', label: t('미사용') },
              ]}
              onChange={(event) =>
                setQuery((previous) => ({ ...previous, status: event.target.value }))
              }
              size="small"
              fullWidth
            />
          </Stack>
        </OwpSearchFilter>
      </ExampleSection>
      <ExampleSection title="검색한 항목" description="검색 결과가 없으면 안내 문구를 표시합니다.">
        {results.length > 0 ? (
          <OwpTable
            headers={{ id: t('품목 코드'), name: t('항목명'), quantity: t('재고 수량') }}
            rows={results}
            canTotalCountRow
            totalCount={results.length}
            size="small"
            containerProps={{ sx: { overflowX: 'auto' } }}
          />
        ) : (
          <Typography role="status">{t('검색 결과가 없습니다.')}</Typography>
        )}
      </ExampleSection>
    </>
  );
}
