import { useSearchAction } from '@owp/core/hooks';
import { useEffect, useMemo, useState } from 'react';
import { Button, MenuItem, TextField, Typography } from '@mui/material';
import { OwpPageCarded, OwpPageContent, OwpTable, OwpSearchFilter } from '@owp/components';
import { usePageLeaveGuard } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CoreExampleProps } from '../model/types';
import { exampleRows } from '../model/fixtures';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice, CoreToggle } from '../runtime/Controls';

const routeOptions = ['/list', '/detail'] as const;

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const searchAction = useSearchAction();
  const location = useLocation();
  const navigate = useNavigate();
  const language = i18n.language;
  const [responsive, setResponsive] = useState(true);
  const [dirtyDraft, setDirtyDraft] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('all');
  const [filters, setFilters] = useState({ name: '', status: 'all' });
  const hasUnsavedFilter = name !== filters.name || status !== filters.status;
  const isDirty = dirtyDraft || hasUnsavedFilter;

  const { requestDiscard } = usePageLeaveGuard(isDirty);
  const activeRoute: (typeof routeOptions)[number] =
    location.pathname === '/detail' ? '/detail' : '/list';
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
    onData({
      filters,
      responsiveLayout: responsive,
      scroll: 'normal',
      isDirty,
      pathname: activeRoute,
      rows,
    });
  }, [activeRoute, filters, isDirty, responsive, onData, rows]);

  return (
    <CoreDemo
      controls={
        <>
          <CoreToggle label="반응형 레이아웃" value={responsive} onChange={setResponsive} />
          <CoreToggle
            label="미저장 변경 상태"
            value={dirtyDraft}
            onChange={(next) => {
              setDirtyDraft(next);
              onRecord('dirty.toggle', String(next));
            }}
          />
          <CoreChoice
            label="경로"
            value={activeRoute}
            options={routeOptions}
            onChange={(nextRoute) => {
              void navigate(nextRoute);
              onRecord('navigate', nextRoute);
            }}
          />
        </>
      }
    >
      <DemoSection>
        <OwpPageCarded
          sx={{ minWidth: 0, width: '100%', height: 'auto', minHeight: 0 }}
          header={
            <OwpSearchFilter
              title={t('검색 조건')}
              responsiveLayout={responsive}
              actions={
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    void requestDiscard(() => {
                      setName('');
                      setStatus('all');
                      setFilters({ name: '', status: 'all' });
                      setDirtyDraft(false);
                      onRecord('discard.confirm', t('검색 조건과 결과를 초기화했습니다.'));
                    });
                  }}
                >
                  {t('보호된 초기화')}
                </Button>
              }
              isRunning={searchAction.isRunning}
              isCanceling={searchAction.isCanceling}
              onCancel={searchAction.cancel}
              onSubmit={() =>
                searchAction.run(() => {
                  setFilters({ name, status });
                  setDirtyDraft(false);
                  onRecord('submit', JSON.stringify({ name, status }));
                })
              }
              onReset={() => {
                setName('');
                setStatus('all');
                setFilters({ name: '', status: 'all' });
                setDirtyDraft(false);
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
              <Typography variant="body2" role="status">
                {t('현재 페이지: {{path}}', { path: activeRoute })}
              </Typography>
              <OwpTable
                aria-label={t('조회 결과')}
                variant="dataGrid"
                size="small"
                headers={{ name: t('이름'), status: t('상태') }}
                rows={rows.map((row) => ({ name: t(row.name), status: t(row.status) }))}
              />
            </OwpPageContent>
          }
          scroll={'normal'}
          fillContentHeight={false}
          responsiveLayout={responsive}
        />
      </DemoSection>
    </CoreDemo>
  );
}
