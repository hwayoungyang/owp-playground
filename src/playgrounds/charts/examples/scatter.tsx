import { useState } from 'react';

import { factoryNoise } from '../model/factoryData';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Controls, Range } from '../runtime/Controls';
import { type NativeData, type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [radius, setRadius] = useState(5);
  const chartData: NativeData = {
    datasets: data.datasets.map((dataset, i) => ({
      ...dataset,
      showLine: false,
      pointRadius: radius,
      yAxisID: 'y',
      data: Array.from({ length: 40 }, (_, index) => {
        const x = Math.max(5, Math.min(95, 50 + factoryNoise(index, 11 + i * 3) * 21));
        return {
          x: Number(x.toFixed(1)),
          y: Number(
            Math.max(
              5,
              Math.min(95, 18 + x * 0.58 + i * 12 + factoryNoise(index, 27 + i * 9) * 11),
            ).toFixed(1),
          ),
        };
      }),
    })),
  };
  const options: NativeOptions = {
    scales: {
      x: { type: 'linear', min: 0, max: 100 },
      y: { type: 'linear', min: 0, max: 100 },
    },
  };
  return (
    <>
      <Controls>
        <Range label="Point 크기" value={radius} min={2} max={10} onChange={setRadius} />
      </Controls>
      <SampleFrame type="line" data={chartData} options={options} {...props} />
    </>
  );
}
