import { useEffect, useState } from 'react';
import { OwpFieldTable, OwpNumberField } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { ExampleSection } from '../runtime/ExampleSection';
import type { ComponentsExampleProps } from '../model/types';

export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [input, setInput] = useState({ quantity: '10', unitPrice: '1250.50', taxRate: '10' });
  const subtotal = Math.round(Number(input.quantity) * Number(input.unitPrice) * 100) / 100;
  const tax = Math.round(subtotal * Number(input.taxRate)) / 100;
  const total = subtotal + tax;
  useEffect(() => {
    onData({ ...input, subtotal, tax, total });
  }, [input, subtotal, tax, total, onData]);
  return (
    <>
      <ExampleSection
        title="수량·단가·세율"
        description="수량은 정수로, 단가와 세율은 소수 둘째 자리까지 입력합니다."
      >
        <div className="components-example-grid">
          <OwpNumberField
            label={t('주문 수량')}
            value={input.quantity}
            valueIsNumericString
            decimalScale={0}
            allowNegative={false}
            size="small"
            fullWidth
            suffix={t(' 개')}
            helperText={t('0 이상의 정수를 입력하세요.')}
            onValueChange={(next, info) => {
              if (info.source !== 'event') return;
              setInput((previous) => ({ ...previous, quantity: next.value }));
              onRecord('order.quantity', next.value);
            }}
          />
          <OwpNumberField
            label={t('개당 가격')}
            value={input.unitPrice}
            valueIsNumericString
            decimalScale={2}
            fixedDecimalScale
            thousandSeparator
            allowNegative={false}
            size="small"
            fullWidth
            onValueChange={(next, info) => {
              if (info.source !== 'event') return;
              setInput((previous) => ({ ...previous, unitPrice: next.value }));
              onRecord('order.unitPrice', next.value);
            }}
          />
          <OwpNumberField
            label={t('세율')}
            value={input.taxRate}
            valueIsNumericString
            decimalScale={2}
            suffix="%"
            allowNegative={false}
            size="small"
            fullWidth
            onValueChange={(next, info) => {
              if (info.source !== 'event') return;
              setInput((previous) => ({ ...previous, taxRate: next.value }));
              onRecord('order.taxRate', next.value);
            }}
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="계산한 주문 금액"
        description="입력한 값으로 공급가액과 세액을 계산합니다. 서버 저장은 수행하지 않습니다."
      >
        <OwpFieldTable
          data={{ subtotal, tax, total }}
          titleWidth="40%"
          layout={[
            [{ title: t('공급가액'), key: 'subtotal', contentType: 'number', valueDecimals: 2 }],
            [{ title: t('세액'), key: 'tax', contentType: 'number', valueDecimals: 2 }],
            [{ title: t('합계 금액'), key: 'total', contentType: 'number', valueDecimals: 2 }],
          ]}
        />
      </ExampleSection>
    </>
  );
}
