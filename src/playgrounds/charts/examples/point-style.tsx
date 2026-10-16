import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Choice, Controls } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [mode, setMode] = useState<'circle' | 'rect' | 'triangle' | 'star' | 'crossRot'>('circle');

  const chartData: NativeData = {
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
      <ChartCanvas type="line" data={chartData} options={options} {...props} />
    </>
  );
}
