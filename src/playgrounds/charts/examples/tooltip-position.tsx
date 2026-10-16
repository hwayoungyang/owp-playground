import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Choice, Controls } from '../runtime/Controls';
import { type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [mode, setMode] = useState<'average' | 'nearest'>('average');

  const options: NativeOptions = { plugins: { tooltip: { position: mode } } };
  return (
    <>
      <Controls>
        <Choice
          label="위치 계산"
          value={mode}
          options={['average', 'nearest']}
          onChange={setMode}
        />
      </Controls>
      <SampleFrame type="line" data={data} options={options} {...props} />
    </>
  );
}
