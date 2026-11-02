import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Typography } from '@mui/material';
import { createOwpApiHooks } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { ApiRequestResult } from './components/api-request-result';
import { createApiResponseObserver } from '../model/api-response-observation';
import type { CoreExampleProps } from '../model/types';
import {
  mutationPolicies,
  owpEndpoints,
  owpResponseTypes,
  queryPolicies,
  rawEndpoints,
  rawResponseTypes,
  requestInit,
  requestModes,
  responseGuidance,
  responseModes,
} from '../model/api-response';
import type { ApiJsonBody, ApiOutcome, ApiPaths, ApiRequestOptions } from '../model/api-response';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice, CoreToggle } from '../runtime/Controls';
export function CoreExample(props: CoreExampleProps) {
  const [observer] = useState(createApiResponseObserver);
  const [owpScenario, setOwpScenario] = useState<keyof typeof owpEndpoints>('조회 결과 있음');
  const [rawScenario, setRawScenario] = useState<keyof typeof rawEndpoints>('JSON 객체');
  const [responseMode, setResponseMode] = useState<(typeof responseModes)[number]>('owp');
  const [mode, setMode] = useState<(typeof requestModes)[number]>('Query');
  const [policy, setPolicy] = useState<(typeof mutationPolicies)[number]>('기본 검사');
  const [guidance, setGuidance] = useState(false);
  const activePolicy = mode === 'Query' && policy === '호출부 직접 판정' ? '기본 검사' : policy;
  const endpoint = responseMode === 'owp' ? owpEndpoints[owpScenario] : rawEndpoints[rawScenario];
  return (
    <CoreDemo
      controls={
        <>
          <CoreChoice label="요청 방식" value={mode} options={requestModes} onChange={setMode} />
          <CoreChoice
            label="응답 모드"
            value={responseMode}
            options={responseModes}
            onChange={setResponseMode}
          />
          {responseMode === 'owp' ? (
            <CoreChoice
              label="응답 유형"
              value={owpScenario}
              options={owpResponseTypes}
              onChange={setOwpScenario}
            />
          ) : (
            <CoreChoice
              label="응답 유형"
              value={rawScenario}
              options={rawResponseTypes}
              onChange={setRawScenario}
            />
          )}
          {responseMode === 'owp' && (
            <CoreChoice
              label="응답 판정"
              value={activePolicy}
              options={mode === 'Query' ? queryPolicies : mutationPolicies}
              onChange={setPolicy}
            />
          )}
          <CoreToggle label="오류 알림 표시" value={guidance} onChange={setGuidance} />
        </>
      }
    >
      <ApiRequest
        key={`${endpoint}:${responseMode}:${mode}:${activePolicy}:${guidance}`}
        {...props}
        observer={observer}
        endpoint={endpoint}
        mode={mode}
        responseMode={responseMode}
        policy={activePolicy}
        guidance={guidance}
      />
    </CoreDemo>
  );
}

function ApiRequest({
  endpoint,
  mode,
  responseMode,
  policy,
  guidance,
  onRecord,
  onData,
  observer,
}: CoreExampleProps &
  ApiRequestOptions & {
    readonly observer: ReturnType<typeof createApiResponseObserver>;
  }) {
  const { t } = useOwpTranslation();
  const queryClient = useQueryClient();
  const mutationAbortController = useRef<AbortController | null>(null);
  const [outcome, setOutcome] = useState<ApiOutcome>({ kind: 'idle' });
  const observedInit = useMemo(
    () => ({ ...requestInit, middleware: observer.middleware }),
    [observer],
  );
  const api = useMemo(
    () =>
      createOwpApiHooks<ApiPaths>({
        baseUrl: window.location.origin,
        getAccessToken: () => '',
        successResultCode: 'STATUS_1',
        isI18nEnabled: false,
        isErrorMessageEnabled: guidance,
        authErrors: ['AUTH_EXPIRED'],
        onAuthError: (message) => onRecord('auth.error', message),
      }),
    [guidance, onRecord],
  );
  const path = new URL(endpoint, window.location.href).pathname;
  const responseOptions = useMemo(
    () =>
      ({
        responseMode,
        allowMissingResultCode: responseMode === 'owp' && policy === 'resultCode 누락 허용',
        enabled: false,
        retry: false,
      }) as const,
    [responseMode, policy],
  );
  const queryKey = useMemo(
    () => api.queryOptions('get', path, observedInit, responseOptions).queryKey,
    [api, path, observedInit, responseOptions],
  );
  // Accept를 지정해 존재하지 않는 JSON 경로가 SPA 문서로 대체되지 않도록 합니다.
  const query = api.useApiQuery('get', path, observedInit, responseOptions);
  const mutation = api.useApiMutation('get', path, {
    responseMode,
    retry: false,
    isServerMessageEnabled: false,
    isServerErrorMessageEnabled: responseMode === 'raw' || policy !== '호출부 직접 판정',
    allowMissingResultCode: responseOptions.allowMissingResultCode,
  });
  const pending = query.isFetching || mutation.isPending;
  useEffect(() => {
    const pendingRequest = new AbortController();
    mutationAbortController.current = pendingRequest;
    return () => {
      pendingRequest.abort();
      mutationAbortController.current = null;
      void queryClient.cancelQueries({ queryKey, exact: true });
    };
  }, [queryClient, queryKey]);

  useEffect(() => {
    onData({
      path,
      mode,
      responseMode,
      ...(responseMode === 'owp' && { policy }),
      isErrorMessageEnabled: guidance,
      outcome,
    });
  }, [path, mode, responseMode, policy, guidance, outcome, onData]);

  async function request() {
    const activeController = mutationAbortController.current;
    if (!activeController) return;
    observer.reset();
    onRecord('request', `${mode} ${path}`);
    try {
      let data: ApiJsonBody;
      if (mode === 'Query') {
        const response = await query.refetch({ throwOnError: true });
        if (!response.isSuccess) return;
        data = response.data;
      } else {
        data = await mutation.mutateAsync({ ...observedInit, signal: activeController.signal });
      }
      if (activeController.signal.aborted) return;
      setOutcome({ kind: 'success', data, response: observer.read() });
      onRecord('request.success', JSON.stringify(data));
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (activeController.signal.aborted) return;
      setOutcome({ kind: 'error', message: error.message, response: observer.read() });
      onRecord('request.error', error.message);
    }
  }

  return (
    <DemoSection description="Query와 GET mutation으로 OWP 응답과 raw JSON 응답을 요청하고 반환값을 비교합니다.">
      <Button variant="outlined" loading={pending} onClick={request}>
        {t('조회')}
      </Button>
      <Typography variant="body2" color="text.secondary">
        {t(responseGuidance[responseMode === 'raw' ? 'raw' : policy])}
      </Typography>
      <ApiRequestResult outcome={outcome} pending={pending} responseMode={responseMode} />
    </DemoSection>
  );
}
