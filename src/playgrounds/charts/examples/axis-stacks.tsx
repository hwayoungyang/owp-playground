import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [value, setValue] = useState(2);

  const chartData: NativeData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      yAxisID: index ? 'lower' : 'upper',
    })),
  };
  const options: NativeOptions = {
    scales: {
      x: { type: 'category' },
      upper: {
        type: 'linear',
        position: 'left',
        stack: 'panels',
        stackWeight: value,
        min: 0,
        max: 100,
      },
      lower: {
        type: 'linear',
        position: 'left',
        stack: 'panels',
        stackWeight: 1,
        min: 0,
        max: 100,
      },
    },
  };
  return (
    <>
      <Controls>
        <Range label="위쪽 영역 비중" value={value} min={1} max={4} step={1} onChange={setValue} />
      </Controls>
      <ChartCanvas type="line" data={chartData} options={options} {...props} />
    </>
  );
}
