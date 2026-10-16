import { alpha } from '@mui/material/styles';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useChartPalette } from '../model/useCartesian';
import { Controls, Toggle } from '../runtime/Controls';
import { type NativeData, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const [layered, setLayered] = useState(true);
  const [labels, setLabels] = useState(true);
  const data: NativeData = {
    labels: Array.from({ length: 6 }, (_, index) => t('라인 {{number}}', { number: index + 1 })),
    datasets: [
      {
        label: '2024',
        data: [3.5, 1.7, 2.8, 2.6, 1.4, 2.6],
        backgroundColor: palette.colors[0],
        order: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
        grouped: !layered,
        borderRadius: 0,
      },
      {
        label: '2025',
        data: [4.2, 3.1, 2.9, 2.3, 2.1, 4.9],
        backgroundColor: alpha(palette.colors[1] ?? palette.warning, 0.9),
        order: 0,
        barPercentage: layered ? 0.5 : 0.8,
        categoryPercentage: 0.8,
        grouped: !layered,
        borderRadius: 0,
      },
    ],
  };
  return (
    <>
      <Controls>
        <Toggle label="Column 겹치기" value={layered} onChange={setLayered} />
        <Toggle label="값 표시" value={labels} onChange={setLabels} />
      </Controls>
      <SampleFrame
        type="bar"
        data={data}
        options={{
          scales: { x: { grid: { display: false } }, y: { min: 0, max: 5.5 } },
          plugins: {
            datalabels: {
              display: labels,
              anchor: 'end',
              align: (context) => (layered ? (context.datasetIndex === 0 ? -135 : -45) : 'end'),
              offset: 4,
              color: palette.ink,
              formatter: (value: number) => value.toFixed(1),
            },
          },
        }}
        {...props}
      />
    </>
  );
}
