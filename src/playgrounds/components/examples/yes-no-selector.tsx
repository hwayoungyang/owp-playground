import { OwpYesNoSelector } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState({ basic: 'Y', labels: 'N', all: '' }, props);
  return (
    <>
      <ExampleSection title="Y/N 기본 선택" description="Y와 N 값을 기본 문구로 선택합니다.">
        <div className="components-example-grid">
          <OwpYesNoSelector
            fullWidth
            size="small"
            label={t('사용 여부')}
            value={values.basic}
            showAllOption={false}
            onChange={(event) => change('basic', event.target.value)}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="업무 문구로 선택"
        description="값은 Y/N으로 유지하고 사용·미사용 문구를 표시합니다."
      >
        <div className="components-example-grid">
          <OwpYesNoSelector
            fullWidth
            size="small"
            label={t('사용 여부')}
            value={values.labels}
            showAllOption={false}
            yesLabel={t('사용')}
            noLabel={t('미사용')}
            onChange={(event) => change('labels', event.target.value)}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="전체 선택 포함"
        description="전체 선택은 빈 문자열로 전달하고 Y/N과 구분합니다."
      >
        <div className="components-example-grid">
          <OwpYesNoSelector
            fullWidth
            size="small"
            label={t('사용 여부')}
            value={values.all}
            showAllOption
            onChange={(event) => change('all', event.target.value)}
          />
        </div>
      </ExampleSection>
    </>
  );
}
