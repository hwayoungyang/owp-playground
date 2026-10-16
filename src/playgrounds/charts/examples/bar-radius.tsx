import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Controls, Range } from '../runtime/Controls';
import { type NativeData, type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('bar');
  const [value, setValue] = useState(12);

  const sample: NativeData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      borderRadius: value,
      borderSkipped: false,
    })),
  };
  const options: NativeOptions = {};
  return (
    <>
      <Controls>
        <Range label="Column radius" value={value} min={0} max={36} step={1} onChange={setValue} />
      </Controls>
      <SampleFrame type="bar" data={sample} options={options} {...props} />
    </>
  );
}
