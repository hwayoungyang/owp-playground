import { useEffect, useRef, useState } from 'react';
import { MenuItem, OutlinedInput, TextField, Typography } from '@mui/material';
import { OwpTable } from '@owp/components';
// useSearchAction으로 query 진행 상태 추적과 취소 정책을 연결하는 Core adapter입니다.
import { OwpQuerySelector, OwpSearchFilter } from '@owp/core';
import { useQueryClient } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { queryFixture, type QueryFixtureItem } from '../model/fixtures';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreToggle } from '../runtime/Controls';
import itemsUrl from '../data/processes.json?url&no-inline';

const searchPath = '/playground/core/items';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const queryClient = useQueryClient();
  const [itemId, setItemId] = useState('');
  const [status, setStatus] = useState('all');
  const [responsive, setResponsive] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [skeleton, setSkeleton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<readonly QueryFixtureItem[]>(queryFixture.resultData);
  const pending = useRef<AbortController | null>(null);
  const apiUrl = new URL(itemsUrl, window.location.href).href;

  useEffect(
    () => () => {
      pending.current?.abort();
      pending.current = null;
      void queryClient.cancelQueries({ queryKey: ['get', searchPath] });
    },
    [queryClient],
  );

  useEffect(() => {
    onData({
      filters: { itemId, status },
      responsiveLayout: responsive,
      showSubmitLoading: showLoading,
      showSkeleton: skeleton,
      loading,
      results,
    });
  }, [itemId, status, responsive, showLoading, skeleton, loading, results, onData]);

  function stop() {
    pending.current?.abort();
    pending.current = null;
    setLoading(false);
    return queryClient.cancelQueries({ queryKey: ['get', searchPath] });
  }

  async function search(): Promise<void> {
    if (pending.current) return;
    const request = new AbortController();
    pending.current = request;
    setLoading(true);
    onRecord('submit', JSON.stringify({ itemId, status }));
    try {
      const next = await queryClient.fetchQuery({
        queryKey: ['get', searchPath, { itemId, status }],
        staleTime: 0,
        retry: false,
        queryFn: ({ signal }) =>
          new Promise<readonly QueryFixtureItem[]>((resolve, reject) => {
            const abort = () => {
              request.abort();
              window.clearTimeout(timer);
              reject(new DOMException('Search canceled', 'AbortError'));
            };
            const timer = window.setTimeout(() => {
              signal.removeEventListener('abort', abort);
              resolve(
                queryFixture.resultData.filter(
                  (row) =>
                    (!itemId || row.id === itemId) &&
                    (status === 'all' || row.active === (status === 'active')),
                ),
              );
            }, 900);
            signal.addEventListener('abort', abort, { once: true });
          }),
      });
      if (pending.current === request && !request.signal.aborted) {
        setResults(next);
        onRecord('complete', t('{{count}}건을 조회했습니다.', { count: next.length }));
      }
    } catch (error) {
      if (error instanceof Error && request.signal.aborted) return;
      throw error;
    } finally {
      if (pending.current === request) {
        pending.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <CoreDemo
      controls={
        <>
          <CoreToggle label="반응형 레이아웃" value={responsive} onChange={setResponsive} />
          <CoreToggle
            label="조회 버튼 로딩"
            value={showLoading}
            onChange={(next) => {
              void stop();
              setShowLoading(next);
            }}
          />
          <CoreToggle
            label="Skeleton 레이아웃"
            value={skeleton}
            onChange={(next) => {
              void stop();
              setSkeleton(next);
            }}
          />
        </>
      }
    >
      <DemoSection>
        <OwpSearchFilter
          title={t('검색 조건')}
          responsiveLayout={responsive}
          showSubmitLoading={showLoading}
          showSkeleton={skeleton}
          submitProgressFilter={{ paths: [searchPath] }}
          onSubmit={search}
          onReset={() => {
            void stop();
            setItemId('');
            setStatus('all');
            setResults(queryFixture.resultData);
            onRecord('reset', t('검색 조건과 결과를 초기화했습니다.'));
          }}
          onCancel={async () => {
            await stop();
            onRecord('cancel', t('조회 작업을 취소했습니다.'));
          }}
        >
          <div className="core-field">
            <OwpQuerySelector<QueryFixtureItem>
              apiUrl={apiUrl}
              query={{}}
              valueKey="id"
              labelResolver={(row) => (i18n.language === 'en' ? row.nameEn : row.nameKo)}
              queryKeyDeps={[i18n.language]}
              value={itemId}
              label={t('이름')}
              textFieldProps={{ variant: 'outlined', size: 'small' }}
              selectProps={{
                variant: 'outlined',
                size: 'small',
                input: <OutlinedInput label={t('이름')} />,
              }}
              fullWidth
              disabled={loading}
              onChange={(event) => setItemId(event.target.value)}
            />
          </div>
          <div className="core-field">
            <TextField
              select
              label={t('상태')}
              value={status}
              variant="outlined"
              size="small"
              fullWidth
              disabled={loading}
              onChange={(event) => setStatus(event.target.value)}
            >
              <MenuItem value="all">{t('전체')}</MenuItem>
              <MenuItem value="active">{t('사용')}</MenuItem>
              <MenuItem value="inactive">{t('미사용')}</MenuItem>
            </TextField>
          </div>
        </OwpSearchFilter>
        <Typography component="p" role="status" aria-live="polite">
          {loading ? t('조회 중') : t('조회 결과 {{count}}건', { count: results.length })}
        </Typography>
        <OwpTable
          aria-label={t('조회 결과')}
          variant="dataGrid"
          size="small"
          headers={{ name: t('이름'), status: t('상태') }}
          rows={results.map((row) => ({
            name: i18n.language === 'en' ? row.nameEn : row.nameKo,
            status: t(row.active ? '사용' : '미사용'),
          }))}
        />
      </DemoSection>
    </CoreDemo>
  );
}
