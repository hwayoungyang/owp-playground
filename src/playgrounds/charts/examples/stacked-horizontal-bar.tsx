import { createBarSegmentLabels } from '@owp/charts/utils';
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
    labels: years.toReversed(),
    datasets: processNames.map((name, index) => ({
      label: t(name),
      data: (processValues[index] ?? []).toReversed(),
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
      datalabels: createBarSegmentLabels({
        font: { size: 12, weight: 600 },
        enabled: labels,
        palette,
        formatter: (value) => value.toFixed(1),
      }),
      tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${item.parsed.x}` } },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="구간 값 표시" value={labels} onChange={setLabels} />
      </Controls>
      {labels && <p className="chart-note">{t('안쪽 라벨은 막대 안에 들어갈 때만 표시합니다.')}</p>}
      <ChartCanvas type="bar" data={data} options={options} {...props} />
    </>
  );
}
