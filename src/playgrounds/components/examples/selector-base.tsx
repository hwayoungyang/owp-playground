import { OwpSelectorBase } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    { select: 'active', autocomplete: 'inactive', multiple: 'active,inactive' },
    props,
  );
  return (
    <>
      <ExampleSection
        title="목록에서 선택"
        description="정적 option을 드롭다운에서 하나 선택합니다."
      >
        <div className="components-example-grid">
          <OwpSelectorBase
            fullWidth
            label={t('상태')}
            name="select"
            value={values.select}
            options={[
              { value: 'active', label: t('사용') },
              { value: 'inactive', label: t('미사용') },
              { value: 'locked', label: t('선택 불가'), disabled: true },
            ]}
            selectorType="select"
            showAllOption={false}
            selectProps={{ size: 'small' }}
            onChange={(event) => change('select', event.target.value)}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="검색해서 선택"
        description="입력한 문자열로 option을 검색하고 항목을 선택합니다."
      >
        <div className="components-example-grid">
          <OwpSelectorBase
            fullWidth
            label={t('상태')}
            name="autocomplete"
            value={values.autocomplete}
            options={[
              { value: 'active', label: t('사용') },
              { value: 'inactive', label: t('미사용') },
              { value: 'locked', label: t('선택 불가'), disabled: true },
            ]}
            selectorType="autocomplete"
            showAllOption={false}
            textFieldProps={{ size: 'small' }}
            onChange={(event) => change('autocomplete', event.target.value)}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="Autocomplete 다중 선택"
        description="선택한 항목을 chip으로 표시하고 쉼표로 구분한 문자열로 저장합니다."
      >
        <div className="components-example-grid">
          <OwpSelectorBase
            fullWidth
            label={t('상태')}
            name="multiple"
            value={values.multiple}
            options={[
              { value: 'active', label: t('사용') },
              { value: 'inactive', label: t('미사용') },
              { value: 'locked', label: t('선택 불가'), disabled: true },
            ]}
            selectorType="autocomplete"
            multiple
            showAllOption={false}
            textFieldProps={{ size: 'small' }}
            onChange={(event) => change('multiple', event.target.value)}
          />
        </div>
      </ExampleSection>
    </>
  );
}
