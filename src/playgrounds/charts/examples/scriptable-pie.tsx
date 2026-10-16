import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Range } from '../runtime/Controls';
import { ThresholdExplanation } from '../runtime/ThresholdExplanation';

export function ChartExample(props: ChartExampleProps) {
  const { data, palette } = useNativeData('doughnut');
  const [value, setValue] = useState(40);

  const chartData: NativeData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: (context: { readonly raw: unknown }) =>
        Number(context.raw) >= value ? palette.colors[0] : palette.colors[1],
    })),
  };
  const options: NativeOptions = { cutout: 0 };
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
      <ThresholdExplanation value={value} kind="pie" />
      <ChartCanvas type="doughnut" data={chartData} options={options} radial {...props} />
    </>
  );
}
