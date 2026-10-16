import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useChartPalette, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(12);
  const allRecords = useMonthlyRecords();
  const palette = useChartPalette();
  const [vertical, setVertical] = useState(false);
  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [{ dataKey: 'actual', label: t('실적'), type: 'bar' }],
      options: {
        plugins: {
          datalabels: {
            display: true,
            color: palette.ink,
            anchor: 'end',
            align: 'end',
            rotation: vertical ? -90 : 0,
            formatter: (value: number) => String(value),
          },
        },
        layout: { padding: { top: 24 } },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시할 월 수" value={count} min={3} max={12} onChange={setCount} />
        <Toggle label="라벨 세로 표시" value={vertical} onChange={setVertical} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame type="bar" {...chart} height="100%" />
      </div>
    </>
  );
}
