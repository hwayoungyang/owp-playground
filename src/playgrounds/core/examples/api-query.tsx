import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { createOwpApiHooks } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import { isCancelledError, useQueryClient } from '@owp/core/query';
import { isOwpApiAuthError } from '@owp/core/utils';
import { ApiRequestResult } from './components/api-request-result';
import { createApiResponseObserver } from '../model/api-response-observation';
import type { CoreExampleProps } from '../model/types';
import {
  mutationPolicies,
  owpEndpoints,
  owpResponseTypes,
  queryFixtures,
  queryPolicies,
  rawEndpoints,
  rawResponseTypes,
  requestInit,
  requestModes,
  responseGuidance,
  responseModes,
} from '../model/api-response';
import type {
  ApiJsonBody,
  ApiOutcome,
  ApiPaths,
  ApiQueryFixture,
  ApiRequestOptions,
} from '../model/api-response';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice, CoreToggle } from '../runtime/Controls';

function errorDetails(error: unknown) {
  return error instanceof Error ? { name: error.name, message: error.message } : null;
}

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
  const activeRequest = useRef<{ cancelled: boolean } | null>(null);
  const [outcome, setOutcome] = useState<ApiOutcome>({ kind: 'idle' });
  const [fixture, setFixture] = useState<ApiQueryFixture>('선택한 응답');
  const [validationEnabled, setValidationEnabled] = useState(false);
  const validateResponse = mode === 'Query' && responseMode === 'owp' && validationEnabled;
  const attempts = useSyncExternalStore(observer.subscribe, observer.getSnapshot);
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
      }) as const,
    [responseMode, policy],
  );
  const validationOptions = useMemo(
    () =>
      validateResponse
        ? {
            validateResponse: (response: ApiJsonBody) => {
              if (
                response === null ||
                typeof response !== 'object' ||
                !('resultData' in response) ||
                !Array.isArray(response.resultData)
              )
                throw new Error(t('이 예제에서는 resultData가 목록이어야 합니다.'));
              if (response.resultData.length === 0)
                throw new Error(t('이 예제에서는 빈 resultData를 검증 오류로 처리합니다.'));
            },
            retry: (failureCount: number, error: unknown) => {
              if (
                isOwpApiAuthError(error) ||
                isCancelledError(error) ||
                (error instanceof Error && error.name === 'AbortError')
              )
                return false;
              return failureCount < 1;
            },
            retryDelay: 1000,
          }
        : { retry: false as const },
    [validateResponse, t],
  );
  const queryKey = useMemo(
    () => api.queryOptions('get', path, observedInit, responseOptions).queryKey,
    [api, path, observedInit, responseOptions],
  );
  // Accept를 지정해 존재하지 않는 JSON 경로가 SPA 문서로 대체되지 않도록 합니다.
  const query = api.useApiQuery('get', path, observedInit, {
    ...responseOptions,
    ...validationOptions,
  });
  const mutation = api.useApiMutation('get', path, {
    responseMode,
    retry: false,
    isServerMessageEnabled: false,
    isServerErrorMessageEnabled: responseMode === 'raw' || policy !== '호출부 직접 판정',
    allowMissingResultCode: responseOptions.allowMissingResultCode,
  });
  const pending = query.isFetching || mutation.isPending || outcome.kind === 'pending';
  useEffect(() => {
    const pendingRequest = new AbortController();
    mutationAbortController.current = pendingRequest;
    return () => {
      pendingRequest.abort();
      if (activeRequest.current) activeRequest.current.cancelled = true;
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
      validateResponse,
      fixture: validateResponse ? fixture : undefined,
      attempts: outcome.kind === 'idle' ? 0 : attempts,
      ...(mode === 'Query' && {
        queryKey,
        query: {
          status: query.status,
          fetchStatus: query.fetchStatus,
          isFetching: query.isFetching,
          failureCount: query.failureCount,
          error: errorDetails(query.error),
          failureReason: errorDetails(query.failureReason),
          data: query.data,
        },
      }),
      outcome,
    });
  }, [
    path,
    mode,
    responseMode,
    policy,
    guidance,
    validateResponse,
    fixture,
    attempts,
    queryKey,
    query.status,
    query.fetchStatus,
    query.isFetching,
    query.failureCount,
    query.error,
    query.failureReason,
    query.data,
    outcome,
    onData,
  ]);

  async function request() {
    const activeController = mutationAbortController.current;
    if (!activeController || activeRequest.current) return;
    const currentRequest = { cancelled: false };
    activeRequest.current = currentRequest;
    setOutcome({ kind: 'pending' });
    // fixture 선택값은 수동 조회 시작에 고정하고, 자동 retry에는 같은 시리즈를 사용합니다.
    observer.reset(validateResponse ? fixture : '선택한 응답');
    onRecord('request', `${mode} ${path}`);
    try {
      let data: ApiJsonBody;
      if (mode === 'Query') {
        const response = await query.refetch({ throwOnError: true });
        if (currentRequest.cancelled) return;
        if (!response.isSuccess) return;
        data = response.data;
      } else {
        data = await mutation.mutateAsync({ ...observedInit, signal: activeController.signal });
      }
      if (activeController.signal.aborted || currentRequest.cancelled) return;
      setOutcome({ kind: 'success', data, response: observer.read() });
      onRecord('request.success', JSON.stringify(data));
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (activeController.signal.aborted || currentRequest.cancelled) return;
      if (isCancelledError(error)) {
        setOutcome({ kind: 'cancelled' });
        onRecord('request.cancelled', path);
        return;
      }
      setOutcome({ kind: 'error', message: error.message, response: observer.read() });
      onRecord('request.error', error.message);
    } finally {
      if (activeRequest.current === currentRequest) activeRequest.current = null;
    }
  }

  async function cancelQuery() {
    if (!activeRequest.current || mode !== 'Query') return;
    activeRequest.current.cancelled = true;
    await queryClient.cancelQueries({ queryKey, exact: true });
    setOutcome({ kind: 'cancelled' });
    onRecord('request.cancelled', path);
  }

  return (
    <DemoSection description="Query와 GET mutation으로 OWP 응답과 raw JSON 응답을 요청하고 반환값을 비교합니다.">
      {mode === 'Query' && responseMode === 'owp' && (
        <Box component="fieldset" disabled={pending} sx={{ border: 0, p: 0, m: 0 }}>
          <CoreToggle
            label="validateResponse 검증"
            value={validationEnabled}
            onChange={(nextEnabled) => {
              if (!pending) setValidationEnabled(nextEnabled);
            }}
          />
        </Box>
      )}
      {validateResponse && (
        <>
          <Box component="fieldset" disabled={pending} sx={{ border: 0, p: 0, m: 0 }}>
            <CoreChoice
              label="검증 fixture"
              value={fixture}
              options={queryFixtures}
              onChange={(nextFixture) => {
                if (!pending) setFixture(nextFixture);
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t(
              '빈 목록은 기본적으로 정상입니다. 이 예제의 검증을 켜면 전체 성공 응답의 resultData가 비어 있지 않은 목록인지 검사합니다. fixture를 바꿔도 endpoint와 query key는 유지합니다.',
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(
              '검증·일반 오류는 1초 후 한 번만 재시도합니다. 인증 오류·CancelledError·AbortError는 재시도하지 않습니다. AbortError fixture는 오류 guard를 재현하며, 조회 취소는 QueryClient로 실제 요청과 재시도 대기를 취소합니다.',
            )}
          </Typography>
        </>
      )}
      <Button variant="outlined" loading={pending} onClick={request}>
        {t('조회')}
      </Button>
      {mode === 'Query' && (
        <Button variant="outlined" disabled={!pending} onClick={cancelQuery}>
          {t('조회 취소')}
        </Button>
      )}
      <Typography variant="body2" color="text.secondary">
        {t(responseGuidance[responseMode === 'raw' ? 'raw' : policy])}
      </Typography>
      <ApiRequestResult
        outcome={outcome}
        pending={pending}
        responseMode={responseMode}
        queryState={
          mode === 'Query'
            ? {
                status: query.status,
                fetchStatus: query.fetchStatus,
                failureCount: query.failureCount,
                attempts: outcome.kind === 'idle' ? 0 : attempts,
                error: errorDetails(query.error)?.message,
                failureReason: errorDetails(query.failureReason)?.message,
                data: query.data,
              }
            : undefined
        }
      />
    </DemoSection>
  );
}
