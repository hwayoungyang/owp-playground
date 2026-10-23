import { useEffect, useState } from 'react';
import { Alert, Button, Typography } from '@mui/material';
import { OwpTable } from '@owp/core';
import { createOwpApiHooks } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import type { QueryFixtureItem } from '../model/fixtures';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice } from '../runtime/Controls';
import rowsUrl from '../data/processes.json?url&no-inline';
import emptyUrl from '../data/processes-empty.json?url&no-inline';
import errorUrl from '../data/processes-error.json?url&no-inline';

const endpoints = { '정상 응답': rowsUrl, '빈 응답': emptyUrl, '실패 응답': errorUrl } as const;
const { useApiQuery } = createOwpApiHooks<Record<string, never>>({
  baseUrl: window.location.origin,
  successResultCode: 'STATUS_1',
  isI18nEnabled: false,
  isErrorMessageEnabled: false,
});

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const [scenario, setScenario] = useState<keyof typeof endpoints>('정상 응답');
  const path = new URL(endpoints[scenario], window.location.href).pathname;
  const query = useApiQuery<QueryFixtureItem>('get', path, {}, { enabled: false, retry: false });
  const data = query.data?.resultData ?? [];
  useEffect(() => {
    onData({
      path,
      status: query.status,
      fetchStatus: query.fetchStatus,
      data: query.data ?? null,
    });
  }, [path, query.status, query.fetchStatus, query.data, onData]);
  return (
    <CoreDemo
      controls={
        <CoreChoice
          label="응답"
          value={scenario}
          options={['정상 응답', '빈 응답', '실패 응답'] as const}
          onChange={setScenario}
        />
      }
    >
      <DemoSection description="조회 버튼으로 mock 응답을 요청합니다.">
        <Button
          variant="outlined"
          loading={query.isFetching}
          onClick={async () => {
            onRecord('request', path);
            const result = await query.refetch();
            onRecord(
              result.isError ? 'request.error' : 'request.success',
              JSON.stringify(result.data ?? null),
            );
          }}
        >
          {t('조회')}
        </Button>
        {query.isError ? (
          <Alert severity="error">{t('조회에 실패했습니다. 다시 시도해 주세요.')}</Alert>
        ) : (
          <>
            <OwpTable
              aria-label={t('조회 결과')}
              headers={{ id: 'ID', name: t('이름') }}
              rows={data.map((row) => ({
                id: row.id,
                name: i18n.language === 'en' ? row.nameEn : row.nameKo,
              }))}
              size="small"
            />
            <Typography variant="body2" role="status">
              {query.isSuccess
                ? t('조회 결과 {{count}}개', { count: data.length })
                : t('조회 버튼을 눌러 주세요.')}
            </Typography>
          </>
        )}
      </DemoSection>
    </CoreDemo>
  );
}
