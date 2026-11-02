import { Box, Button, Stack, Typography } from '@mui/material';
import { OwpErrorBoundary } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';
class ComponentExampleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComponentExampleError';
  }
}
function RenderContent({
  broken,
  message,
}: {
  readonly broken: boolean;
  readonly message: string;
}) {
  const { t } = useOwpTranslation();
  if (broken) throw new ComponentExampleError(message);
  return <Typography variant="body2">{t('하위 콘텐츠를 정상적으로 표시합니다.')}</Typography>;
}

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    {
      manual: { broken: false, revision: 0, message: '' },
      automatic: { broken: false, revision: 0 },
    },
    props,
  );
  return (
    <>
      <ExampleSection
        title="오류 포착과 수동 복구"
        description="오류 안내를 확인한 뒤 예제를 다시 시작해 정상 화면으로 돌아옵니다."
      >
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            disabled={values.manual.broken}
            onClick={() => change('manual', { ...values.manual, broken: true })}
          >
            {t('오류 발생시키기')}
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              change('manual', { broken: false, revision: values.manual.revision + 1, message: '' })
            }
          >
            {t('예제 다시 시작')}
          </Button>
        </Stack>
        <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
          <OwpErrorBoundary
            key={values.manual.revision}
            onError={(error) =>
              change('manual', {
                ...values.manual,
                message: error instanceof Error ? error.message : String(error),
              })
            }
          >
            <RenderContent
              broken={values.manual.broken}
              message={t('수동 복구 예제 오류입니다.')}
            />
          </OwpErrorBoundary>
        </Box>
      </ExampleSection>
      <ExampleSection
        title="오류 발생 후 자동 복구"
        description="onErrorRecovery에서 화면 상태를 복구합니다. true를 반환하면 기본 onError 알림을 생략합니다."
      >
        <Button
          variant="outlined"
          onClick={() => change('automatic', { ...values.automatic, broken: true })}
        >
          {t('오류 후 자동 복구')}
        </Button>
        <OwpErrorBoundary
          key={values.automatic.revision}
          onErrorRecovery={() => {
            change('automatic', { broken: false, revision: values.automatic.revision + 1 });
            return true;
          }}
        >
          <RenderContent
            broken={values.automatic.broken}
            message={t('자동 복구 예제 오류입니다.')}
          />
        </OwpErrorBoundary>
      </ExampleSection>
    </>
  );
}
