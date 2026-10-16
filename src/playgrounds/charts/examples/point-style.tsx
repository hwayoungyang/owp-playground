import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Choice, Controls } from '../runtime/Controls';
import { type NativeData, type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [mode, setMode] = useState<'circle' | 'rect' | 'triangle' | 'star' | 'crossRot'>('circle');

  const sample: NativeData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({ ...dataset, pointStyle: mode, pointRadius: 6 })),
  };
  const options: NativeOptions = {};
  return (
    <>
      <Controls>
        <Choice
          label="표시 방식"
          value={mode}
          options={['circle', 'rect', 'triangle', 'star', 'crossRot']}
          onChange={setMode}
        />
      </Controls>
      <SampleFrame type="line" data={sample} options={options} {...props} />
    </>
  );
}
