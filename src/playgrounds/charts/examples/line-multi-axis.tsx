import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Controls, Toggle } from '../runtime/Controls';
import { type NativeData, type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [enabled, setEnabled] = useState(true);

  const sample: NativeData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      yAxisID: index ? 'right' : 'left',
    })),
  };
  const options: NativeOptions = {
    scales: {
      x: { type: 'category' },
      left: { type: 'linear', position: 'left', min: 0, max: 100 },
      right: {
        type: 'linear',
        position: 'right',
        display: enabled,
        min: 0,
        max: 120,
        grid: { drawOnChartArea: false },
      },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="오른쪽 축 표시" value={enabled} onChange={setEnabled} />
      </Controls>
      <SampleFrame type="line" data={sample} options={options} {...props} />
    </>
  );
}
