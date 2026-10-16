import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Choice, Controls } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [mode, setMode] = useState<'linear' | 'cubic' | 'monotone'>('linear');

  const chartData: NativeData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      tension: mode === 'linear' ? 0 : 0.4,
      cubicInterpolationMode: mode === 'monotone' ? 'monotone' : 'default',
    })),
  };
  const options: NativeOptions = {};
  return (
    <>
      <Controls>
        <Choice
          label="표시 방식"
          value={mode}
          options={['linear', 'cubic', 'monotone']}
          onChange={setMode}
        />
      </Controls>
      <ChartCanvas type="line" data={chartData} options={options} {...props} />
    </>
  );
}
