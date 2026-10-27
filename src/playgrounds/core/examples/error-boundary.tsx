import { recoverFromDynamicImportChunkLoadError } from '@owp/utils/browser';
import { useEffect, useState } from 'react';
import { Alert, Box, Button } from '@mui/material';
import { OwpErrorBoundary } from '@owp/components';
// Components 오류 경계에 청크 로드 실패 1회 새로고침과 앱 오류 복구 정책을 연결합니다.

import { useOwpTranslation } from '@owp/components/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';

class ExampleRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExampleRenderError';
  }
}

function RenderContent({ crash, message }: { readonly crash: boolean; readonly message: string }) {
  const { t } = useOwpTranslation();
  if (crash) throw new ExampleRenderError(message);
  return <Alert severity="success">{t('하위 콘텐츠가 정상적으로 표시됩니다.')}</Alert>;
}

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({ crash: false, revision: 0 });
  const hasRouteError = location.pathname === '/route-error';
  useEffect(() => {
    onData({
      ...state,
      routePath: location.pathname,
      hasRouteError,
    });
  }, [hasRouteError, location.pathname, onData, state]);

  return (
    <CoreDemo
      controls={
        <>
          <Button
            variant="outlined"
            disabled={state.crash}
            onClick={() => {
              setState((current) => ({ ...current, crash: true }));
              onRecord('error.trigger', 'ExampleRenderError');
            }}
          >
            {t('렌더 오류 발생')}
          </Button>
          <Button
            variant="outlined"
            disabled={!state.crash}
            onClick={() => {
              setState((current) => ({ crash: false, revision: current.revision + 1 }));
              onRecord('error.recover', 'boundary remounted');
            }}
          >
            {t('오류 경계 복구')}
          </Button>
          <Button
            variant="outlined"
            disabled={hasRouteError}
            onClick={() => {
              void navigate('/route-error');
              onRecord('route.error', '/route-error');
            }}
          >
            {t('라우트 오류 발생')}
          </Button>
          <Button
            variant="outlined"
            disabled={!hasRouteError}
            onClick={() => {
              void navigate('/list');
              onRecord('route.recover', '/list');
            }}
          >
            {t('라우트 오류 복구')}
          </Button>
        </>
      }
    >
      <DemoSection
        title="렌더 오류 경계와 수동 복구"
        description="동적 import(청크) 실패는 sessionStorage 키 기준으로 1회 자동 새로고침을 시도하며, 일반 렌더 오류는 원인을 해결한 뒤 key 재마운트로 복구합니다."
      >
        <Box sx={{ maxHeight: 400, overflow: 'auto', width: '100%' }}>
          <OwpErrorBoundary
            key={state.revision}
            onErrorRecovery={recoverFromDynamicImportChunkLoadError}
            onError={(error, info) => console.error('Uncaught error:', error, info)}
          >
            <RenderContent
              crash={state.crash}
              message={t('예제에서 의도적으로 발생시킨 렌더 오류입니다.')}
            />
          </OwpErrorBoundary>
        </Box>
      </DemoSection>
      <DemoSection
        title="Data Router 라우트 오류 처리"
        description="라우트 loader·action 오류는 Data Router의 errorElement에 연결한 OwpRouteErrorElement가 처리합니다."
      >
        <Box sx={{ maxHeight: 400, overflow: 'auto', width: '100%' }}>
          <Outlet />
        </Box>
      </DemoSection>
    </CoreDemo>
  );
}
