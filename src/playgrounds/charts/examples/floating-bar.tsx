import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Controls, Range } from '../runtime/Controls';
import { type NativeData, type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('bar');
  const [value, setValue] = useState(10);

  const sample: NativeData = {
    ...data,
    datasets: [
      {
        ...data.datasets[0],
        data: [
          [10 + value, 42 + value],
          [30, 65],
          [20, 58],
          [50, 90],
          [32, 76],
          [15, 54],
        ],
      },
    ],
  };
  const options: NativeOptions = {};
  return (
    <>
      <Controls>
        <Range label="구간 이동" value={value} min={-20} max={20} step={1} onChange={setValue} />
      </Controls>
      <SampleFrame type="bar" data={sample} options={options} {...props} />
    </>
  );
}
