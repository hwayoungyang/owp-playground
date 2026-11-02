import { OwpBarcodeInputField } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    { controlled: '', uncontrolled: 'ABC123', scanner: '' },
    props,
  );
  return (
    <>
      <ExampleSection
        title="controlled 바코드 입력"
        description="정규화된 대문자 값을 React state에 저장합니다."
      >
        <div className="components-example-grid">
          <OwpBarcodeInputField
            fullWidth
            size="small"
            label={t('바코드')}
            value={values.controlled}
            helperText={t('한글 자판으로 입력해도 영문 대문자로 바뀝니다.')}
            onChange={(event) => change('controlled', event.target.value)}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="기본값을 가진 바코드"
        description="defaultValue로 시작하고 컴포넌트가 입력값을 관리합니다."
      >
        <div className="components-example-grid">
          <OwpBarcodeInputField
            fullWidth
            size="small"
            label={t('초기 바코드')}
            defaultValue="ABC123"
            onChange={(event) => change('uncontrolled', event.target.value)}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="스캐너 전용 입력"
        description="preventVirtualKeyboard로 모바일 가상 키보드 표시를 차단합니다."
      >
        <div className="components-example-grid">
          <OwpBarcodeInputField
            fullWidth
            size="small"
            label={t('스캐너 바코드')}
            value={values.scanner}
            preventVirtualKeyboard
            helperText={t('스캐너나 하드웨어 키보드로 입력해 주세요.')}
            onChange={(event) => change('scanner', event.target.value)}
          />
        </div>
      </ExampleSection>
    </>
  );
}
