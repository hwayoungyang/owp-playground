import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('bar');
  const [value, setValue] = useState(12);

  const chartData: NativeData = {
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
      <ChartCanvas type="bar" data={chartData} options={options} {...props} />
    </>
  );
}
