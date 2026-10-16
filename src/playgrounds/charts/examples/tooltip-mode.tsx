import { useState } from 'react';
import type { NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Choice, Controls } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [mode, setMode] = useState<'index' | 'nearest' | 'dataset' | 'point' | 'x' | 'y'>('index');

  const options: NativeOptions = { interaction: { mode, intersect: false } };
  return (
    <>
      <Controls>
        <Choice
          label="탐색 방식"
          value={mode}
          options={['index', 'nearest', 'dataset', 'point', 'x', 'y']}
          onChange={setMode}
        />
      </Controls>
      <ChartCanvas type="line" data={data} options={options} {...props} />
    </>
  );
}
