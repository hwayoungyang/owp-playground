import { Button, TextField, Typography } from '@mui/material';
import { OwpDeferredMount } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    {
      deferred: { revision: 0, input: '' },
      immediate: { revision: 0, input: '' },
      reset: { revision: 0, input: '' },
    },
    props,
  );
  return (
    <>
      <ExampleSection
        title="입력란 늦게 표시하기"
        description="defer를 켜면 입력란을 바로 만들지 않고 공통 대기열에서 나누어 준비합니다."
      >
        <Button
          variant="outlined"
          onClick={() => change('deferred', { revision: values.deferred.revision + 1, input: '' })}
        >
          {t('입력란 다시 만들기')}
        </Button>
        <OwpDeferredMount
          defer
          fallback={<Typography role="status">{t('화면을 준비하고 있습니다.')}</Typography>}
        >
          {' '}
          <div className="components-example-grid">
            <TextField
              key={values.deferred.revision}
              size="small"
              fullWidth
              label={t('하위 입력')}
              value={values.deferred.input}
              onChange={(event) =>
                change('deferred', { ...values.deferred, input: event.target.value })
              }
            />
          </div>{' '}
        </OwpDeferredMount>
      </ExampleSection>
      <ExampleSection
        title="입력란 바로 표시하기"
        description="defer를 끄면 대기열을 거치지 않고 입력란을 바로 만듭니다."
      >
        <Button
          variant="outlined"
          onClick={() =>
            change('immediate', { revision: values.immediate.revision + 1, input: '' })
          }
        >
          {t('입력란 다시 만들기')}
        </Button>
        <OwpDeferredMount
          defer={false}
          fallback={<Typography role="status">{t('화면을 준비하고 있습니다.')}</Typography>}
        >
          {' '}
          <div className="components-example-grid">
            <TextField
              key={values.immediate.revision}
              size="small"
              fullWidth
              label={t('하위 입력')}
              value={values.immediate.input}
              onChange={(event) =>
                change('immediate', { ...values.immediate, input: event.target.value })
              }
            />
          </div>{' '}
        </OwpDeferredMount>
      </ExampleSection>
      <ExampleSection
        title="초기화 후 다시 표시"
        description="버튼을 누르면 resetKey와 입력란의 key를 바꿔 입력 내용을 비웁니다."
      >
        <Button
          variant="outlined"
          onClick={() => change('reset', { revision: values.reset.revision + 1, input: '' })}
        >
          {t('입력란 다시 만들기')}
        </Button>
        <OwpDeferredMount
          defer
          resetKey={values.reset.revision}
          fallback={<Typography role="status">{t('화면을 준비하고 있습니다.')}</Typography>}
        >
          {' '}
          <div className="components-example-grid">
            <TextField
              key={values.reset.revision}
              size="small"
              fullWidth
              label={t('하위 입력')}
              value={values.reset.input}
              onChange={(event) => change('reset', { ...values.reset, input: event.target.value })}
            />
          </div>{' '}
        </OwpDeferredMount>
      </ExampleSection>
    </>
  );
}
