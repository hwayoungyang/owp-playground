import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [enabled, setEnabled] = useState(true);

  const chartData: NativeData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      pointStyle: index ? 'triangle' : 'rectRot',
    })),
  };
  const options: NativeOptions = { plugins: { tooltip: { usePointStyle: enabled } } };
  return (
    <>
      <Controls>
        <Toggle label="Tooltip에 Point 모양 사용" value={enabled} onChange={setEnabled} />
      </Controls>
      <ChartCanvas type="line" data={chartData} options={options} {...props} />
    </>
  );
}
