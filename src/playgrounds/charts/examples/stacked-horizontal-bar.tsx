import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import { processNames, processValues, years } from '../model/referenceData';
import type { ChartExampleProps } from '../model/types';
import { useChartPalette } from '../model/useCartesian';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const [labels, setLabels] = useState(true);
  const data: NativeData = {
    labels: [...years].reverse(),
    datasets: processNames.map((name, index) => ({
      label: t(name),
      data: [...(processValues[index] ?? [])].reverse(),
      backgroundColor: palette.colors[index],
      stack: 'processes',
      borderRadius: 0,
      barPercentage: 0.7,
    })),
  };
  const options: NativeOptions = {
    indexAxis: 'y',
    scales: {
      x: { stacked: true, min: 0, suggestedMax: 12 },
      y: { stacked: true, grid: { display: false } },
    },
    plugins: {
      datalabels: {
        display: (context) => {
          const value = context.dataset.data[context.dataIndex];
          return (
            labels &&
            typeof value === 'number' &&
            (context.chart.chartArea.width * value) / 12 >= 28
          );
        },
        color: (context) =>
          palette.contrastText(palette.colors[context.datasetIndex] ?? palette.surface),
        formatter: (value: number) => (value >= 0.4 ? value.toFixed(1) : ''),
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
