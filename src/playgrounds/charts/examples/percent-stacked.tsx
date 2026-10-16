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

  const records = allRecords.slice(0, count).map((row) => {
    const sum = Number(row.lineA) + Number(row.lineB) + Number(row.lineC);
    return {
      ...row,
      lineA: (100 * Number(row.lineA)) / sum,
      lineB: (100 * Number(row.lineB)) / sum,
      lineC: (100 * Number(row.lineC)) / sum,
    };
  });
  const chart = useCartesian(
    {
      records,
      series: [
        { dataKey: 'lineA', label: t('라인 A'), type: 'bar', stack: 'output' },
        { dataKey: 'lineB', label: t('라인 B'), type: 'bar', stack: 'output' },
        { dataKey: 'lineC', label: t('라인 C'), type: 'bar', stack: 'output' },
      ],
      options: {
        scales: {
          x: createCategoryAxisScale({ stacked: true }),
          y: createPercentAxisScale({ stacked: true, domain: createAxisDomain(0, 100) }),
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
        <ChartFrame type="bar" {...chart} height="100%" />
      </div>
    </>
  );
}
