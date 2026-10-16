import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useChartPalette } from '../model/useCartesian';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const [labels, setLabels] = useState(true);
  const data: NativeData = {
    labels: ['2021', '2022', '2023', '2024', '2025'],
    datasets: [
      {
        label: t('계획'),
        data: [23.5, 26.2, 30.1, 29.5, 24.6],
        backgroundColor: palette.colors[0],
        borderRadius: 0,
      },
      {
        label: t('실적'),
        data: [18.1, 22.8, 23.9, 25.1, 25],
        backgroundColor: palette.colors[1],
        borderRadius: 0,
      },
    ],
  };
  const options: NativeOptions = {
    indexAxis: 'y',
    scales: { x: { min: 0, max: 35 }, y: { grid: { display: false } } },
    plugins: {
      legend: { position: 'top' },
      datalabels: {
        display: labels,
        color: palette.ink,
        anchor: 'end',
        align: 'end',
        formatter: (value: number) => value.toFixed(1),
      },
      tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${item.parsed.x}` } },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="값 표시" value={labels} onChange={setLabels} />
      </Controls>
      <ChartCanvas type="bar" data={data} options={options} {...props} />
    </>
  );
}
