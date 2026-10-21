import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(12);
  const allRecords = useMonthlyRecords();
  const [top, setTop] = useState(false);
  const [animated, setAnimated] = useState(true);
  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [
        { dataKey: 'plan', label: t('계획'), type: 'bar' },
        { dataKey: 'actual', label: t('실적'), type: 'bar' },
      ],
      options: {},
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시할 월 수" value={count} min={3} max={12} onChange={setCount} />
        <Toggle label="범례를 상단에 표시" value={top} onChange={setTop} />
        <Toggle label="Legend animation" value={animated} onChange={setAnimated} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          type="bar"
          {...chart}
          height="100%"
          legend={{
            position: top ? 'top' : 'bottom',
            align: 'center',
            animation: animated ? { duration: 160 } : false,
            onClick: (item) => props.onRecord?.('legend-click', String(item.label)),
          }}
        />
      </div>
    </>
  );
}
