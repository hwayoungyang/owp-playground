import { ChartFrame } from '@owp/charts';
import {
  createAxisDomain,
  createCategoryAxisScale,
  createPercentAxisScale,
  formatTooltipLabel,
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
        { dataKey: 'rate', label: t('라인 A'), type: 'line', yAxisId: 'rate' },
        { dataKey: 'performance', label: t('라인 B'), type: 'line', yAxisId: 'rate' },
        { dataKey: 'availability', label: t('라인 C'), type: 'line', yAxisId: 'rate' },
      ],
      options: {
        scales: {
          x: createCategoryAxisScale(),
          rate: createPercentAxisScale({ position: 'right', domain: createAxisDomain(0, 130) }),
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => formatTooltipLabel(context, (value) => `${value.toFixed(1)}%`),
            },
          },
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
        <ChartFrame type="line" {...chart} height="100%" />
      </div>
    </>
  );
}
