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
  const [enabled, setEnabled] = useState(true);
  const [labels, setLabels] = useState(true);
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
      datalabels: createBarSegmentLabels({
        font: { size: 12, weight: 600 },
        enabled: labels,
        palette,
        formatter: (value) => value.toFixed(1),
      }),
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="그룹별 누적" value={enabled} onChange={setEnabled} />
        <Toggle label="구간 값 표시" value={labels} onChange={setLabels} />
      </Controls>
      {labels && <p className="chart-note">{t('안쪽 라벨은 막대 안에 들어갈 때만 표시합니다.')}</p>}
      <ChartCanvas
        type="bar"
        data={data}
        options={options}
        legendFormatter={
          enabled
            ? (label, item) =>
                t('그룹 {{number}} · {{series}}', {
                  number: item.datasetIndex < 2 ? 1 : 2,
                  series: label,
                })
            : undefined
        }
        {...props}
      />
    </>
  );
}
