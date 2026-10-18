import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Range } from '../runtime/Controls';
import { ThresholdExplanation } from '../runtime/ThresholdExplanation';

export function ChartExample(props: ChartExampleProps) {
  const { data, palette } = useNativeData('bar');
  const [value, setValue] = useState(40);

  const chartData: NativeData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.data.map((raw) =>
        Number(raw) >= value ? palette.colors[0] : palette.colors[1],
      ),
    })),
  };
  const options: NativeOptions = { plugins: { legend: { display: false } } };
  return (
    <>
      <Controls>
        <Range
          label="생산량 기준값 (개)"
          value={value}
          min={20}
          max={60}
          step={5}
          onChange={setValue}
        />
      </Controls>
      <ThresholdExplanation value={value} />
      <ChartCanvas type="bar" data={chartData} options={options} {...props} />
    </>
  );
}
