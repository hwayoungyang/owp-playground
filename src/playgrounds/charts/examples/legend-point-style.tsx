import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Controls, Toggle } from '../runtime/Controls';
import { type NativeData, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [enabled, setEnabled] = useState(true);

  const sample: NativeData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      pointRadius: enabled ? 3 + index : 0,
    })),
  };
  return (
    <>
      <Controls>
        <Toggle label="Point 표시 범례" value={enabled} onChange={setEnabled} />
      </Controls>
      <SampleFrame type="line" data={sample} {...props} />
    </>
  );
}
