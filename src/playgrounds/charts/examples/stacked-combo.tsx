import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import { monthlyRecords } from '../model/data';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { data, palette } = useNativeData('bar');
  const [enabled, setEnabled] = useState(true);

  const chartData: NativeData = {
    ...data,
    datasets: [
      ...data.datasets
        .concat([{ label: t('라인 C'), data: monthlyRecords.slice(0, 6).map((row) => row.lineC) }])
        .map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          backgroundColor: palette.colors[index],
          type: 'bar' as const,
          stack: 'output',
          order: 1,
        })),
      {
        type: 'line' as const,
        order: 0,
        label: t('목표'),
        data: monthlyRecords.slice(0, 6).map((row) => row.plan),
        borderColor: palette.colors[3],
        backgroundColor: palette.colors[3],
        borderWidth: 2,
      },
    ],
  };
  const options: NativeOptions = {
    scales: { x: { stacked: enabled }, y: { stacked: enabled, beginAtZero: true } },
  };
  return (
    <>
      <Controls>
        <Toggle label="Column 누적" value={enabled} onChange={setEnabled} />
      </Controls>
      <ChartCanvas type="bar" data={chartData} options={options} {...props} />
    </>
  );
}
