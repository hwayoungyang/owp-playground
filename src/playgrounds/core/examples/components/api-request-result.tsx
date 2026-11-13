import { Alert, AlertTitle, Typography } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { CodeSnippet } from '../../../../features/code/CodeSnippet';
import { JsonResult } from '../../../../features/code/JsonResult';
import { apiResultCode } from '../../model/api-response-observation';
import type { ApiOutcome, ApiQueryState, ApiRequestOptions } from '../../model/api-response';

export function ApiRequestResult({
  outcome,
  pending,
  responseMode,
  queryState,
}: {
  readonly outcome: ApiOutcome;
  readonly pending: boolean;
  readonly responseMode: ApiRequestOptions['responseMode'];
  readonly queryState?: ApiQueryState;
}) {
  const { t } = useOwpTranslation();
  return (
    <>
      {queryState && (
        <Typography variant="body2" role="status">
          {t(
            'Query: {{status}} / {{fetchStatus}} · 요청 시도 {{attempts}}회 · 실패 {{failureCount}}회',
            {
              status: queryState.status,
              fetchStatus: queryState.fetchStatus,
              attempts: queryState.attempts,
              failureCount: queryState.failureCount,
            },
          )}
        </Typography>
      )}
      {!pending && queryState?.error !== undefined && (
        <Typography variant="body2">
          {t('Query 오류: {{error}}', { error: queryState.error })}
        </Typography>
      )}
      {pending && queryState?.failureReason !== undefined && (
        <Typography variant="body2">
          {t('Query 실패 원인: {{error}}', { error: queryState.failureReason })}
        </Typography>
      )}
      <ApiRequestOutcome outcome={outcome} pending={pending} responseMode={responseMode} />
      {queryState?.data !== undefined && (
        <>
          <Typography variant="body2" color="text.secondary">
            {t(
              'query.data는 마지막 정상 결과입니다. 재조회 실패와 취소 뒤에도 Query가 보존한 데이터를 표시합니다.',
            )}
          </Typography>
          <JsonResult label="query.data" value={queryState.data} />
        </>
      )}
    </>
  );
}

function ApiRequestOutcome({
  outcome,
  pending,
  responseMode,
}: {
  readonly outcome: ApiOutcome;
  readonly pending: boolean;
  readonly responseMode: ApiRequestOptions['responseMode'];
}) {
  const { t } = useOwpTranslation();
  if (pending || outcome.kind === 'pending')
    return (
      <Alert severity="info" role="status">
        {t('요청 중입니다.')}
      </Alert>
    );
  if (outcome.kind === 'idle')
    return (
      <Typography variant="body2" color="text.secondary">
        {t('조회 버튼을 눌러 주세요.')}
      </Typography>
    );
  if (outcome.kind === 'cancelled')
    return (
      <Alert severity="info" role="status">
        {t(
          '조회가 취소되었습니다. 이전 Query 데이터는 유지하며 이번 조회를 성공으로 처리하지 않습니다.',
        )}
      </Alert>
    );

  const body =
    outcome.kind === 'success'
      ? { kind: 'json' as const, value: outcome.data }
      : outcome.response?.body;
  const code = body?.kind === 'json' ? apiResultCode(body.value) : undefined;
  const businessFailure = responseMode === 'owp' && code === 'STATUS_0';
  const httpFailure = outcome.response !== undefined && outcome.response.status >= 400;
  const title =
    outcome.kind === 'error'
      ? httpFailure
        ? 'HTTP 요청 실패'
        : !outcome.response
          ? '요청 실패'
          : businessFailure
            ? '업무 처리 실패'
            : '응답 판정 실패'
      : businessFailure
        ? '업무 오류 응답'
        : '요청 완료';
  const severity = outcome.kind === 'error' ? 'error' : businessFailure ? 'warning' : 'success';

  return (
    <>
      <Alert
        severity={severity}
        role={severity === 'error' ? 'alert' : 'status'}
        sx={{ whiteSpace: 'pre-wrap' }}
      >
        <AlertTitle>{t(title)}</AlertTitle>
        {outcome.kind === 'error'
          ? outcome.message
          : businessFailure
            ? t('요청은 완료되었지만 resultCode가 STATUS_0입니다. 응답 내용을 확인해 주세요.')
            : t('아래에서 응답 JSON을 확인할 수 있습니다.')}
        {outcome.response !== undefined && (
          <div>{t('HTTP 상태: {{status}}', { status: outcome.response.status })}</div>
        )}
      </Alert>
      {body?.kind === 'json' && <JsonResult label="response.json" value={body.value} />}
      {body?.kind === 'text' && <CodeSnippet label="response.txt" code={body.value} />}
    </>
  );
}
