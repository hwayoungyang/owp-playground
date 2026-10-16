import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import { factoryNoise } from '../model/factoryData';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [scale, setScale] = useState(1);
  const chartData: NativeData = {
    datasets: data.datasets.map((dataset, i) => ({
      ...dataset,
      showLine: false,
      data: Array.from({ length: 18 }, (_, index) => {
        const x = Math.max(5, Math.min(95, 50 + factoryNoise(index, 11 + i * 3) * 21));
        return {
          x: Number(x.toFixed(1)),
          y: Number(
            Math.max(
              5,
              Math.min(95, 18 + x * 0.58 + i * 12 + factoryNoise(index, 27 + i * 9) * 11),
            ).toFixed(1),
          ),
          r: Number((4 + Math.min(11, Math.abs(factoryNoise(index, 61 + i)) * 5)).toFixed(1)),
        };
      }),
      pointRadius: (context) => {
        const raw: unknown = context.raw;
        return raw && typeof raw === 'object' && 'r' in raw && typeof raw.r === 'number'
          ? raw.r * scale
          : 4;
      },
    })),
  };
  const options: NativeOptions = {
    scales: { x: { type: 'linear', min: 0, max: 100 }, y: { type: 'linear', min: 0, max: 100 } },
  };
  return (
    <>
      <Controls>
        <Range label="크기 배율" value={scale} min={0.5} max={2} step={0.25} onChange={setScale} />
      </Controls>
      <ChartCanvas type="line" data={chartData} options={options} {...props} />
    </>
  );
}
