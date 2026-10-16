import { ChartFrame } from '@owp/charts';
import {
  createAxisDomain,
  createCategoryAxisScale,
  createLinearAxisScale,
  createNumberAxisScale,
  createPercentAxisScale,
} from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(12);
  const allRecords = useMonthlyRecords();
  const [showRateAxis, setShowRateAxis] = useState(false);
  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [
        { dataKey: 'mttf', label: 'MTTF', type: 'line', yAxisId: 'mttf' },
        { dataKey: 'mtbf', label: 'MTBF', type: 'line', yAxisId: 'mtbf' },
        { dataKey: 'rate', label: t('달성률'), type: 'line', yAxisId: 'rate' },
      ],
      options: {
        scales: {
          x: createCategoryAxisScale(),
          mttf: createLinearAxisScale({ domain: createAxisDomain(0, 2), position: 'left' }),
          mtbf: createNumberAxisScale({
            domain: createAxisDomain(0, 350),
            position: 'right',
            grid: { drawOnChartArea: false },
          }),
          rate: createPercentAxisScale({
            domain: createAxisDomain(0, 150),
            position: 'right',
            display: showRateAxis,
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
        <Toggle label="달성률 축 표시" value={showRateAxis} onChange={setShowRateAxis} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame type="line" {...chart} height="100%" />
      </div>
    </>
  );
}
