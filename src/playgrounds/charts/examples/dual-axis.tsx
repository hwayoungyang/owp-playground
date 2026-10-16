import { ChartFrame } from '@owp/charts';
import {
  createAxisDomain,
  createCategoryAxisScale,
  createNumberAxisScale,
  createPercentAxisScale,
} from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(12);
  const allRecords = useMonthlyRecords();

  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [
        { dataKey: 'actual', label: t('실적'), type: 'bar', yAxisId: 'amount', order: 1 },
        { dataKey: 'rate', label: t('달성률'), type: 'line', yAxisId: 'rate', order: 0 },
      ],
      options: {
        scales: {
          x: createCategoryAxisScale(),
          amount: createNumberAxisScale({ beginAtZero: true, position: 'left' }),
          rate: createPercentAxisScale({
            domain: createAxisDomain(0, 140),
            position: 'right',
            grid: { drawOnChartArea: false },
          }),
        },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시할 월 수" value={count} min={3} max={12} onChange={setCount} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame type="bar" {...chart} height="100%" />
      </div>
    </>
  );
}
