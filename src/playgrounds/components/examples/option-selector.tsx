import { OwpOptionSelector } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    { single: 'active', multiple: 'active,inactive', all: '' },
    props,
  );
  return (
    <>
      <ExampleSection title="단일 항목 선택" description="전체 옵션 없이 하나의 상태를 선택합니다.">
        <div className="components-example-grid">
          <OwpOptionSelector
            fullWidth
            size="small"
            label={t('상태')}
            value={values.single}
            options={[
              { value: 'active', label: t('사용') },
              { value: 'inactive', label: t('미사용') },
              { value: 'locked', label: t('선택 불가'), disabled: true },
            ]}
            showAllOption={false}
            onChange={(event) => change('single', event.target.value)}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="다중 항목 선택"
        description="여러 상태를 선택하면 쉼표로 구분한 값으로 전달됩니다."
      >
        <div className="components-example-grid">
          <OwpOptionSelector
            fullWidth
            size="small"
            label={t('상태')}
            value={values.multiple}
            options={[
              { value: 'active', label: t('사용') },
              { value: 'inactive', label: t('미사용') },
              { value: 'locked', label: t('선택 불가'), disabled: true },
            ]}
            multiple
            showAllOption={false}
            onChange={(event) => change('multiple', event.target.value)}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="전체 선택과 필수 입력"
        description="전체 선택을 포함하고 필수 입력 안내를 표시합니다."
      >
        <div className="components-example-grid">
          <OwpOptionSelector
            fullWidth
            size="small"
            label={t('상태')}
            value={values.all}
            options={[
              { value: 'active', label: t('사용') },
              { value: 'inactive', label: t('미사용') },
              { value: 'locked', label: t('선택 불가'), disabled: true },
            ]}
            showAllOption
            required
            helperText={t('조회할 상태를 선택해 주세요.')}
            onChange={(event) => change('all', event.target.value)}
          />
        </div>
      </ExampleSection>
    </>
  );
}
