import { useEffect, useRef, useState } from 'react';
import { Button } from '@mui/material';
import { createOwpApiHooks, useOwpApiInspectorDialog } from '@owp/core/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import type { QueryFixtureItem } from '../model/fixtures';
import { CoreChoice } from '../runtime/Controls';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreResultTable } from '../runtime/CoreResultTable';
import rowsUrl from '../data/processes.json?url&no-inline';
import emptyUrl from '../data/processes-empty.json?url&no-inline';
import errorUrl from '../data/processes-error.json?url&no-inline';

const endpoints = {
  '조회 결과 있음': rowsUrl,
  '조회 결과 없음': emptyUrl,
  '오류 응답': errorUrl,
} as const;
const requestInit = { params: { query: { playground: 'api-inspector' } } } as const;
const { useApiQuery } = createOwpApiHooks<Record<string, never>>({
  baseUrl: window.location.origin,
  getAccessToken: () => '',
  successResultCode: 'STATUS_1',
  isI18nEnabled: false,
  isErrorMessageEnabled: false,
});

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const queryClient = useQueryClient();
  const inspector = useOwpApiInspectorDialog();
  const mounted = useRef(false);
  const [scenario, setScenario] = useState<keyof typeof endpoints>('조회 결과 있음');
  const [hasRequested, setHasRequested] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const path = new URL(endpoints[scenario], window.location.href).pathname;
  const query = useApiQuery<QueryFixtureItem>('get', path, requestInit, {
    enabled: false,
    retry: false,
  });
  const data = query.data?.resultData ?? [];

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const url of Object.values(endpoints)) {
        const requestPath = new URL(url, window.location.href).pathname;
        void queryClient.cancelQueries({
          queryKey: ['get', requestPath, requestInit],
          exact: true,
        });
      }
    };
  }, [queryClient]);

  useEffect(() => {
    onData({
      path,
      status: query.status,
      fetchStatus: query.fetchStatus,
      data: query.data ?? null,
      error: query.error instanceof Error ? query.error.message : null,
      inspectorEnabled: inspector.isApiInspectorEnabled,
      inspectorOpening: inspector.isOpeningApiInspectorDialog,
      inspectorOpen,
    });
  }, [
    path,
    query.status,
    query.fetchStatus,
    query.data,
    query.error,
    inspector.isApiInspectorEnabled,
    inspector.isOpeningApiInspectorDialog,
    inspectorOpen,
    onData,
  ]);

  async function request() {
    onRecord('request', path);
    const result = await query.refetch();
    if (!mounted.current) return;
    if (!result.isSuccess && !result.isError) {
      onRecord('request.cancel', path);
      return;
    }
    setHasRequested(true);
    onRecord(
      result.isError ? 'request.error' : 'request.success',
      result.error instanceof Error ? result.error.message : JSON.stringify(result.data ?? null),
    );
  }

  async function openInspector() {
    setInspectorOpen(true);
    onRecord('inspector.open', path);
    try {
      await inspector.openApiInspectorDialog({
        onEntered: () => {
          if (mounted.current) onRecord('inspector.entered', 'ready');
        },
      });
      if (mounted.current) onRecord('inspector.close', 'closed');
    } finally {
      if (mounted.current) setInspectorOpen(false);
    }
  }

  return (
    <CoreDemo
      controls={
        <CoreChoice
          label="응답 유형"
          value={scenario}
          options={['조회 결과 있음', '조회 결과 없음', '오류 응답'] as const}
          onChange={setScenario}
        />
      }
    >
      <DemoSection description="로컬 응답을 조회한 뒤 API Inspector에서 요청과 응답을 확인합니다.">
        <div className="core-controls">
          <Button variant="outlined" loading={query.isFetching} onClick={request}>
            {t('조회')}
          </Button>
          <Button
            variant="outlined"
            disabled={!inspector.isApiInspectorEnabled || !hasRequested || inspectorOpen}
            loading={inspector.isOpeningApiInspectorDialog}
            onClick={openInspector}
          >
            {t('API Inspector 열기')}
          </Button>
        </div>
        <CoreResultTable
          headers={{ id: 'ID', name: t('항목명') }}
          rows={data.map((row) => ({
            id: row.id,
            name: i18n.language === 'en' ? row.nameEn : row.nameKo,
          }))}
          state={
            query.isFetching
              ? { kind: 'loading', message: t('조회 중') }
              : query.isError
                ? { kind: 'error', message: t('조회에 실패했습니다. 다시 시도해 주세요.') }
                : query.isSuccess
                  ? undefined
                  : { kind: 'idle', message: t('조회 버튼을 눌러 주세요.') }
          }
        />
      </DemoSection>
    </CoreDemo>
  );
}
