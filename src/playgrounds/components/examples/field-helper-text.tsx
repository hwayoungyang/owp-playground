import { Stack, TextField } from '@mui/material';
import { OwpFieldHelperText, OwpRequiredHelperText } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    { basic: '', required: '', error: 'A001' },
    props,
  );
  return (
    <>
      <ExampleSection
        title="기본 입력 안내"
        description="입력값 아래에 필드별 도움말을 연결합니다."
      >
        <div className="components-example-grid">
          <div>
            <TextField
              fullWidth
              size="small"
              label={t('항목명')}
              value={values.basic}
              slotProps={{ htmlInput: { 'aria-describedby': 'basic-field-help', maxLength: 20 } }}
              onChange={(event) => change('basic', event.target.value)}
            />
            <OwpFieldHelperText id="basic-field-help">
              {t('항목명을 20자 이내로 입력해 주세요.')}
            </OwpFieldHelperText>
          </div>
        </div>
      </ExampleSection>
      <ExampleSection
        title="필수 필드와 오류"
        description="필수 표시가 있는 도움말과 샘플 중복 코드 A001의 오류 안내를 비교합니다."
      >
        <div className="components-example-grid">
          <div>
            <TextField
              fullWidth
              size="small"
              label={t('필수 항목명')}
              value={values.required}
              slotProps={{ htmlInput: { 'aria-describedby': 'required-field-help' } }}
              required
              onChange={(event) => change('required', event.target.value)}
            />
            <OwpFieldHelperText id="required-field-help" required>
              {t('필수 입력 항목입니다.')}
            </OwpFieldHelperText>
          </div>
          <div>
            <TextField
              fullWidth
              size="small"
              label={t('코드 중복 예제')}
              value={values.error}
              slotProps={{ htmlInput: { 'aria-describedby': 'duplicate-field-help' } }}
              error={values.error === 'A001'}
              onChange={(event) => change('error', event.target.value)}
            />
            <OwpFieldHelperText id="duplicate-field-help" error={values.error === 'A001'}>
              {values.error === 'A001'
                ? t('A001은 샘플 중복 코드입니다.')
                : t('샘플 중복 코드와 다릅니다.')}
            </OwpFieldHelperText>
          </div>
        </div>
      </ExampleSection>
      <ExampleSection
        title="필수 표시 위치"
        description="OwpRequiredHelperText의 requiredPosition으로 별표 위치를 지정합니다."
      >
        <Stack spacing={2}>
          <OwpRequiredHelperText requiredPosition="left">
            {t('왼쪽 필수 표시')}
          </OwpRequiredHelperText>
          <OwpRequiredHelperText requiredPosition="right">
            {t('오른쪽 필수 표시')}
          </OwpRequiredHelperText>
          <OwpRequiredHelperText required={false}>{t('선택 입력 항목')}</OwpRequiredHelperText>
        </Stack>
      </ExampleSection>
    </>
  );
}
