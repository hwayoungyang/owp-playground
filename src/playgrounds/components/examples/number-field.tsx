import { OwpNumberField } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    {
      integer: '12',
      decimal: '12.3',
      fixed: '12.30',
      grouped: '1234567',
      negative: '-12',
      positive: '12',
      currency: '1250',
      percent: '12.5',
      helper: '3',
      error: '-1',
      disabled: '100',
      readonly: '200',
    },
    props,
  );
  return (
    <>
      <ExampleSection
        title="정수 입력"
        description="decimalScale을 0으로 지정해 소수점 입력을 제한합니다."
      >
        <div className="components-example-grid">
          <OwpNumberField
            fullWidth
            size="small"
            label={t('수량')}
            value={values.integer}
            decimalScale={0}
            onValueChange={(next, info) => {
              if (info.source === 'event') change('integer', next.value);
            }}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="소수점 아래 두 자리"
        description="소수점 아래 두 자리까지 입력하며 부족한 자리에 0을 채우지 않습니다."
      >
        <div className="components-example-grid">
          <OwpNumberField
            fullWidth
            size="small"
            label={t('측정값')}
            value={values.decimal}
            decimalScale={2}
            onValueChange={(next, info) => {
              if (info.source === 'event') change('decimal', next.value);
            }}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="소수점 아래 두 자리 고정"
        description="fixedDecimalScale로 입력한 숫자의 소수점 아래 두 자리를 맞춰 0을 붙입니다."
      >
        <div className="components-example-grid">
          <OwpNumberField
            fullWidth
            size="small"
            label={t('단가')}
            value={values.fixed}
            decimalScale={2}
            fixedDecimalScale
            onValueChange={(next, info) => {
              if (info.source === 'event') change('fixed', next.value);
            }}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="천 단위 구분"
        description="입력란에는 천 단위마다 쉼표를 표시합니다. 데이터 탭에는 쉼표가 없는 문자열을 기록합니다."
      >
        <div className="components-example-grid">
          <OwpNumberField
            fullWidth
            size="small"
            label={t('합계 금액')}
            value={values.grouped}
            thousandSeparator
            decimalScale={0}
            onValueChange={(next, info) => {
              if (info.source === 'event') change('grouped', next.value);
            }}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="음수 허용과 제한"
        description="음수를 허용하는 입력란과 0 이상만 입력할 수 있는 입력란을 비교합니다."
      >
        <div className="components-example-grid">
          <OwpNumberField
            fullWidth
            size="small"
            label={t('음수 허용')}
            value={values.negative}
            allowNegative
            onValueChange={(next, info) => {
              if (info.source === 'event') change('negative', next.value);
            }}
          />
          <OwpNumberField
            fullWidth
            size="small"
            label={t('음수 제한')}
            value={values.positive}
            allowNegative={false}
            onValueChange={(next, info) => {
              if (info.source === 'event') change('positive', next.value);
            }}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="접두사와 접미사"
        description="통화 기호와 단위를 숫자 앞뒤에 표시합니다."
      >
        <div className="components-example-grid">
          <OwpNumberField
            fullWidth
            size="small"
            label={t('통화 금액')}
            value={values.currency}
            prefix="$ "
            thousandSeparator
            decimalScale={2}
            onValueChange={(next, info) => {
              if (info.source === 'event') change('currency', next.value);
            }}
          />
          <OwpNumberField
            fullWidth
            size="small"
            label={t('백분율')}
            value={values.percent}
            suffix=" %"
            decimalScale={1}
            onValueChange={(next, info) => {
              if (info.source === 'event') change('percent', next.value);
            }}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="입력 안내와 오류"
        description="helperText로 정수 입력 형식을 안내하고 음수 금액에는 오류를 표시합니다."
      >
        <div className="components-example-grid">
          <OwpNumberField
            fullWidth
            size="small"
            label={t('수량 안내')}
            value={values.helper}
            decimalScale={0}
            helperText={t('수량은 정수로 입력해 주세요.')}
            onValueChange={(next, info) => {
              if (info.source === 'event') change('helper', next.value);
            }}
          />
          <OwpNumberField
            fullWidth
            size="small"
            label={t('검증할 금액')}
            value={values.error}
            error={Number(values.error) < 0}
            helperText={
              values.error === '' || Number(values.error) < 0
                ? t('금액은 0 이상이어야 합니다.')
                : t('0 이상의 금액을 입력했습니다.')
            }
            onValueChange={(next, info) => {
              if (info.source === 'event') change('error', next.value);
            }}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="비활성화와 읽기 전용"
        description="disabled 입력과 slotProps로 지정한 읽기 전용 입력을 비교합니다."
      >
        <div className="components-example-grid">
          <OwpNumberField
            fullWidth
            size="small"
            label={t('비활성 금액')}
            value={values.disabled}
            disabled
            onValueChange={(next, info) => {
              if (info.source === 'event') change('disabled', next.value);
            }}
          />
          <OwpNumberField
            fullWidth
            size="small"
            label={t('읽기 전용 금액')}
            value={values.readonly}
            slotProps={{ input: { readOnly: true } }}
            onValueChange={(next, info) => {
              if (info.source === 'event') change('readonly', next.value);
            }}
          />
        </div>
      </ExampleSection>
    </>
  );
}
