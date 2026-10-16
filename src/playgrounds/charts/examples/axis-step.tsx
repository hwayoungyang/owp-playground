import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Controls, Range } from '../runtime/Controls';
import { type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('bar');
  const [value, setValue] = useState(20);

  const options: NativeOptions = {
    scales: { x: { type: 'category' }, y: { min: 0, max: 100, ticks: { stepSize: value } } },
  };
  return (
    <>
      <Controls>
        <Range label="눈금 간격" value={value} min={10} max={50} step={10} onChange={setValue} />
      </Controls>
      <SampleFrame type="bar" data={data} options={options} {...props} />
    </>
  );
}
