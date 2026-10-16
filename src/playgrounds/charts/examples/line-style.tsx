import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Choice, Controls } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [mode, setMode] = useState<'solid' | 'dashed' | 'dotted'>('solid');

  const chartData: NativeData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      borderDash: mode === 'solid' ? [] : mode === 'dashed' ? [8, 5] : [2, 4],
      pointRadius: 4,
    })),
  };
  const options: NativeOptions = {};
  return (
    <>
      <Controls>
        <Choice
          label="표시 방식"
          value={mode}
          options={['solid', 'dashed', 'dotted']}
          onChange={setMode}
        />
      </Controls>
      <ChartCanvas type="line" data={chartData} options={options} {...props} />
    </>
  );
}
