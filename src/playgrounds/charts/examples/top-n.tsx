import { ChartFrame } from '@owp/charts';
import { createCategoryAxisScale, createIntegerAxisScale } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useChartPalette, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [limit, setLimit] = useState(5);
  const palette = useChartPalette();
  const records = useMonthlyRecords()
    .map((row, index) => ({
      ...row,
      colorIndex: index,
      category: t('설비 {{number}}', { number: index + 1 }),
    }))
    .sort((a, b) => Number(b.actual) - Number(a.actual))
    .slice(0, limit);
  const chart = useCartesian(
    {
      records,
      series: [
        {
          dataKey: 'actual',
          label: t('생산량'),
          type: 'bar',
          datasetOptions: {
            backgroundColor: records.map(
              (row) => palette.colors[row.colorIndex % palette.colors.length] ?? palette.ink,
            ),
          },
        },
      ],
      options: {
        scales: { x: createCategoryAxisScale(), y: createIntegerAxisScale({ beginAtZero: true }) },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시 개수" value={limit} min={3} max={10} onChange={setLimit} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame {...chart} type="bar" height="100%" legend={false} />
      </div>
    </>
  );
}
