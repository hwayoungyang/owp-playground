import { useEffect, useMemo, useState } from 'react';
import { MenuItem, TextField } from '@mui/material';
import { OwpPageCarded, OwpPageContent, OwpSearchFilter, OwpTable } from '@owp/core';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { exampleRows } from '../model/fixtures';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreToggle } from '../runtime/Controls';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const language = i18n.language;
  const [responsive, setResponsive] = useState(true);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('all');
  const [filters, setFilters] = useState({ name: '', status: 'all' });
  const rows = useMemo(
    () =>
      exampleRows.filter(
        (row) =>
          (filters.status === 'all' || row.status === filters.status) &&
          i18n
            .t(row.name, { ns: 'owp', lng: language })
            .toLowerCase()
            .includes(filters.name.trim().toLowerCase()),
      ),
    [filters, i18n, language],
  );

  useEffect(() => {
    onData({ filters, responsiveLayout: responsive, scroll: 'normal', rows });
  }, [filters, responsive, onData, rows]);

  return (
    <CoreDemo
      controls={<CoreToggle label="반응형 레이아웃" value={responsive} onChange={setResponsive} />}
    >
      <DemoSection>
        <OwpPageCarded
          scroll="normal"
          fillContentHeight={false}
          responsiveLayout={responsive}
          sx={{ minWidth: 0, width: '100%', height: 'auto', minHeight: 0 }}
          header={
            <OwpSearchFilter
              title={t('검색 조건')}
              responsiveLayout={responsive}
              onSubmit={() => {
                setFilters({ name, status });
                onRecord('submit', JSON.stringify({ name, status }));
              }}
              onReset={() => {
                setName('');
                setStatus('all');
                setFilters({ name: '', status: 'all' });
                onRecord('reset', t('검색 조건과 결과를 초기화했습니다.'));
              }}
            >
              <div className="core-field">
                <TextField
                  label={t('이름')}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              </div>
              <div className="core-field">
                <TextField
                  select
                  label={t('상태')}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  <MenuItem value="all">{t('전체')}</MenuItem>
                  <MenuItem value="사용">{t('사용')}</MenuItem>
                  <MenuItem value="미사용">{t('미사용')}</MenuItem>
                </TextField>
              </div>
            </OwpSearchFilter>
          }
          content={
            <OwpPageContent title={t('조회 결과')} responsiveLayout={responsive}>
              <OwpTable
                aria-label={t('조회 결과')}
                variant="dataGrid"
                size="small"
                headers={{ name: t('이름'), status: t('상태') }}
                rows={rows.map((row) => ({ name: t(row.name), status: t(row.status) }))}
              />
            </OwpPageContent>
          }
        />
      </DemoSection>
    </CoreDemo>
  );
}
