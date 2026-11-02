import { TextField } from '@mui/material';
import { OwpFieldTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    { name: 'A', memo: '', matrix: { code: 'A001', group: 'A', quantity: 12 } },
    props,
  );
  return (
    <>
      <ExampleSection
        title="label/value 필드 배치"
        description="data의 값과 필수 표시를 row 단위 layout에 연결합니다."
      >
        <div className="components-example-grid">
          <TextField
            fullWidth
            size="small"
            label={t('항목명')}
            value={values.name}
            onChange={(event) => change('name', event.target.value)}
          />
        </div>
        <OwpFieldTable
          data={{ name: values.name, amount: 12500, enabled: 'Y' }}
          titleWidth="35%"
          variant="dataGrid"
          layout={[
            [{ title: t('항목명'), key: 'name', required: true }],
            [{ title: t('금액'), key: 'amount', contentType: 'number', valueDecimals: 0 }],
            [{ title: t('사용 여부'), key: 'enabled', useCheckbox: true }],
          ]}
        />
      </ExampleSection>
      <ExampleSection
        title="matrix 셀 병합"
        description="cellLayout의 header와 value 셀에 colSpan을 지정합니다."
      >
        <OwpFieldTable
          variant="mui"
          data={values.matrix}
          cellLayout={[
            [
              { cellType: 'header', title: t('항목 코드') },
              { cellType: 'value', key: 'code', colSpan: 3 },
            ],
            [
              { cellType: 'header', title: t('그룹') },
              { cellType: 'value', key: 'group' },
              { cellType: 'header', title: t('수량') },
              { cellType: 'value', key: 'quantity', contentType: 'number' },
            ],
          ]}
        />
      </ExampleSection>
      <ExampleSection
        title="사용자 입력 셀"
        description="render로 편집 필드를 넣고 별도 state에 입력값을 저장합니다."
      >
        <OwpFieldTable
          data={{ memo: values.memo }}
          layout={[
            [
              {
                title: t('메모'),
                key: 'memo',
                contentType: 'input',
                render: () => (
                  <TextField
                    fullWidth
                    size="small"
                    label={t('메모 입력')}
                    value={values.memo}
                    onChange={(event) => change('memo', event.target.value)}
                  />
                ),
              },
            ],
          ]}
        />
      </ExampleSection>
    </>
  );
}
