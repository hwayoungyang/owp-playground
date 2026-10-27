import { useSearchAction } from '@owp/core/hooks';
import { useEffect, useRef, useState } from 'react';
import { MenuItem, OutlinedInput, TextField } from '@mui/material';
import { OwpQuerySelector } from '@owp/core';
import { OwpSearchFilter } from '@owp/components';
import { useQueryClient } from '@tanstack/react-query';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { queryFixture, type QueryFixtureItem } from '../model/fixtures';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreToggle } from '../runtime/Controls';
import { CoreResultTable } from '../runtime/CoreResultTable';
import itemsUrl from '../data/processes.json?url&no-inline';

const searchPath = '/playground/core/items';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const queryClient = useQueryClient();
  const searchAction = useSearchAction({ progressFilter: { paths: [searchPath] } });
  const [itemId, setItemId] = useState('');
  const [status, setStatus] = useState('all');
  const [responsive, setResponsive] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [skeleton, setSkeleton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<readonly QueryFixtureItem[]>([]);
  const [resultState, setResultState] = useState<'idle' | 'ready' | 'error'>('idle');
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
      resultState,
      results,
    });
  }, [itemId, status, responsive, showLoading, skeleton, loading, resultState, results, onData]);

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
        setResultState('ready');
        onRecord('complete', t('{{count}}건을 조회했습니다.', { count: next.length }));
      }
    } catch (error) {
      if (error instanceof Error && request.signal.aborted) return;
      setResults([]);
      setResultState('error');
      onRecord('request.error', error instanceof Error ? error.message : String(error));
    } finally {
      if (pending.current === request) {
        pending.current = null;
        setLoading(false);
      }
    }
  }

  const fields = (
    <>
      <div className="core-field">
        <OwpQuerySelector<QueryFixtureItem>
          apiUrl={apiUrl}
          query={{}}
          valueKey="id"
          labelResolver={(row) => (i18n.language === 'en' ? row.nameEn : row.nameKo)}
          queryKeyDeps={[i18n.language]}
          value={itemId}
          label={t('항목명')}
          textFieldProps={{ variant: 'outlined', size: 'small' }}
          selectProps={{
            variant: 'outlined',
            size: 'small',
            input: <OutlinedInput label={t('항목명')} />,
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
    </>
  );

  return (
    <CoreDemo
      controls={
        <>
          <CoreToggle label="반응형 레이아웃" value={responsive} onChange={setResponsive} />
          <CoreToggle
            label="검색 버튼 로딩"
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
          showSkeleton={skeleton}
          isRunning={showLoading && searchAction.isRunning}
          isCanceling={showLoading && searchAction.isCanceling}
          onSubmit={() => (showLoading ? searchAction.run(search) : search())}
          onReset={() => {
            void stop();
            setItemId('');
            setStatus('all');
            setResults([]);
            setResultState('idle');
            onRecord('reset', t('검색 조건과 결과를 초기화했습니다.'));
          }}
          onCancel={async () => {
            await searchAction.cancel();
            await stop();
            onRecord('cancel', t('조회 작업을 취소했습니다.'));
          }}
        >
          {skeleton ? <div className="core-controls">{fields}</div> : fields}
        </OwpSearchFilter>
        <CoreResultTable
          variant="dataGrid"
          headers={{ name: t('항목명'), status: t('상태') }}
          rows={results.map((row) => ({
            name: i18n.language === 'en' ? row.nameEn : row.nameKo,
            status: t(row.active ? '사용' : '미사용'),
          }))}
          state={
            loading
              ? { kind: 'loading', message: t('조회 중') }
              : resultState === 'error'
                ? { kind: 'error', message: t('조회에 실패했습니다. 다시 시도해 주세요.') }
                : resultState === 'idle'
                  ? { kind: 'idle', message: t('검색 버튼을 눌러 주세요.') }
                  : undefined
          }
        />
      </DemoSection>
    </CoreDemo>
  );
}
