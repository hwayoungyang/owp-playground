import { alpha } from '@mui/material/styles';
import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useChartPalette, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(12);
  const allRecords = useMonthlyRecords();
  const palette = useChartPalette();
  const [width, setWidth] = useState(20);
  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [
        { dataKey: 'lineA', label: t('라인 A'), type: 'line' },
        { dataKey: 'lineB', label: t('라인 B'), type: 'line' },
        { dataKey: 'lineC', label: t('라인 C'), type: 'line' },
      ],
      options: {
        plugins: {
          annotation: {
            annotations: {
              range: {
                type: 'box',
                yMin: 40 - width / 2,
                yMax: 40 + width / 2,
                backgroundColor: alpha(palette.colors[0] ?? palette.ink, 0.12),
                borderWidth: 0,
              },
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
        <Range label="정상 범위 폭" value={width} min={4} max={60} step={2} onChange={setWidth} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame type="line" {...chart} height="100%" />
      </div>
    </>
  );
}
