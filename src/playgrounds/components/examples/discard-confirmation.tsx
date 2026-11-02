import { useEffect, useState } from 'react';
import { Button, TextField } from '@mui/material';
import { OwpDiscardConfirmation } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';
import { createDiscardGuard } from '@owp/components/utils';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [resetController] = useState(createDiscardGuard);
  const [overwriteController] = useState(createDiscardGuard);
  useEffect(() => {
    resetController.setActive(true);
    overwriteController.setActive(true);
    return () => {
      resetController.setActive(false);
      overwriteController.setActive(false);
    };
  }, [resetController, overwriteController]);
  const [values, change] = useComponentExampleState(
    { reset: { draft: '', confirmed: false }, overwrite: { draft: '', confirmed: false } },
    props,
  );
  return (
    <>
      <ExampleSection
        title="입력값 초기화 전 확인"
        description="입력값이 비어 있지 않을 때만 reset 확인창을 열고 승인 후 비웁니다."
      >
        <div className="components-example-grid">
          <TextField
            fullWidth
            size="small"
            label={t('미저장 입력값')}
            value={values.reset.draft}
            onChange={(event) => change('reset', { ...values.reset, draft: event.target.value })}
          />
        </div>
        <Button
          variant="outlined"
          onClick={() => {
            void resetController.request(
              values.reset.draft !== '',
              () => change('reset', { draft: '', confirmed: true }),
              'reset',
            );
          }}
        >
          {t('입력값 초기화 요청')}
        </Button>
        <OwpDiscardConfirmation
          controller={resetController}
          onResolve={async (confirmed) => {
            props.onRecord('reset.resolve', String(confirmed));
            await resetController.resolve(confirmed);
          }}
        />
      </ExampleSection>
      <ExampleSection
        title="값 덮어쓰기 전 확인"
        description="미저장 입력이 있으면 overwrite 확인창을 열고 승인 후 지정한 값으로 바꿉니다."
      >
        <div className="components-example-grid">
          <TextField
            fullWidth
            size="small"
            label={t('미저장 입력값')}
            value={values.overwrite.draft}
            onChange={(event) =>
              change('overwrite', { ...values.overwrite, draft: event.target.value })
            }
          />
        </div>
        <Button
          variant="outlined"
          onClick={() => {
            void overwriteController.request(
              values.overwrite.draft !== '',
              () => change('overwrite', { draft: 'A001', confirmed: true }),
              'overwrite',
            );
          }}
        >
          {t('A001로 덮어쓰기 요청')}
        </Button>
        <OwpDiscardConfirmation
          controller={overwriteController}
          onResolve={async (confirmed) => {
            props.onRecord('overwrite.resolve', String(confirmed));
            await overwriteController.resolve(confirmed);
          }}
        />
      </ExampleSection>
    </>
  );
}
