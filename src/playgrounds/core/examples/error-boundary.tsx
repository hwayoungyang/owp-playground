import { useEffect, useState } from 'react';
import { Alert, Box, Button } from '@mui/material';
import { OwpErrorBoundary } from '@owp/core';
import { useOwpTranslation } from '@owp/components/hooks';
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
  const [state, setState] = useState({ crash: false, revision: 0 });
  useEffect(() => {
    onData(state);
  }, [onData, state]);

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
        </>
      }
    >
      <DemoSection>
        <Box sx={{ maxHeight: 400, overflow: 'auto', width: '100%' }}>
          <OwpErrorBoundary key={state.revision}>
            <RenderContent
              crash={state.crash}
              message={t('예제에서 의도적으로 발생시킨 렌더 오류입니다.')}
            />
          </OwpErrorBoundary>
        </Box>
      </DemoSection>
    </CoreDemo>
  );
}
