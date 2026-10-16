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
  const dayShift = [
    5, 4.4, 3.2, 3.8, 5.1, 5.6, 5.2, 4.2, 3.4, 2.8, 2.2, 1.7, 1.1, 0.8, 0.5, 0.3, 0.2, 0.1,
  ];
  const nightShift = [
    4.8, 4.1, 3.4, 3.8, 5.1, 5.1, 4.8, 4.1, 3.6, 3, 2.5, 1.9, 1.3, 1, 0.8, 0.6, 0.3, 0.3,
  ];
  const data: NativeData = {
    labels: dayShift.map((_, index) => t('공정 {{number}}', { number: index + 1 })),
    datasets: [
      {
        label: t('주간조'),
        data: dayShift.map((value) => -value),
        backgroundColor: palette.colors[0],
        stack: 'shifts',
      },
      {
        label: t('야간조'),
        data: nightShift,
        backgroundColor: palette.colors[1],
        stack: 'shifts',
      },
    ],
  };
  const options: NativeOptions = {
    indexAxis: 'y',
    scales: {
      x: {
        stacked: true,
        min: -8,
        max: 8,
        ticks: { callback: (value) => `${Math.abs(Number(value))}%` },
      },
      y: {
        stacked: true,
        reverse: true,
        ticks: { autoSkip: true, maxTicksLimit: 10 },
        grid: { display: false },
      },
    },
    datasets: { bar: { categoryPercentage: 0.95, barPercentage: 1, borderRadius: 0 } },
    plugins: {
      datalabels: {
        display: (context) =>
          labels && (context.chart.chartArea.height / 18 >= 16 || context.dataIndex % 2 === 0),
        color: palette.ink,
        anchor: (context) => (context.datasetIndex === 0 ? 'start' : 'end'),
        align: (context) => (context.datasetIndex === 0 ? 'left' : 'right'),
        padding: 0,
        formatter: (value: number) => Math.abs(value).toFixed(1),
      },
      tooltip: {
        callbacks: {
          label: (item) => `${item.dataset.label}: ${Math.abs(item.parsed.x ?? 0).toFixed(1)}%`,
        },
      },
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
