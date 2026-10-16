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
      pointStyle: index ? 'triangle' : 'rectRot',
    })),
  };
  const options: NativeOptions = { plugins: { tooltip: { usePointStyle: enabled } } };
  return (
    <>
      <Controls>
        <Toggle label="Point 모양 Tooltip" value={enabled} onChange={setEnabled} />
      </Controls>
      <SampleFrame type="line" data={sample} options={options} {...props} />
    </>
  );
}
