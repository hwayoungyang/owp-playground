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
  const [enabled, setEnabled] = useState(true);
  const data: NativeData = {
    labels: [...years],
    datasets: processNames.map((name, index) => ({
      label: t(name),
      data: [...(processValues[index] ?? [])],
      backgroundColor: palette.colors[index],
      stack: enabled ? (index < 2 ? 'machining' : 'other') : name,
      borderRadius: 0,
      categoryPercentage: 0.75,
      barPercentage: 0.9,
    })),
  };
  const options: NativeOptions = {
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, suggestedMax: 6 },
    },
    plugins: {
      datalabels: {
        display: true,
        color: (context) =>
          palette.contrastText(palette.colors[context.datasetIndex] ?? palette.surface),
        formatter: (value: number) => (value >= 0.4 ? value.toFixed(1) : ''),
      },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="그룹별 누적" value={enabled} onChange={setEnabled} />
      </Controls>
      <ChartCanvas type="bar" data={data} options={options} {...props} />
    </>
  );
}
