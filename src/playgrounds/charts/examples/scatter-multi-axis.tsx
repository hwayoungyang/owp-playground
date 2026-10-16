import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [radius, setRadius] = useState(5);
  const chartData: NativeData = {
    datasets: data.datasets.map((dataset, i) => ({
      ...dataset,
      showLine: false,
      pointRadius: radius,
      yAxisID: i === 1 ? 'y1' : 'y',
      data: Array.from({ length: 20 }, (_, index) => ({
        x: index * 5,
        y: Math.round((50 + 30 * Math.sin(index * 0.8 + i)) * (i === 1 ? 10 : 1)),
      })),
    })),
  };
  const options: NativeOptions = {
    scales: {
      x: { type: 'linear', min: 0, max: 100 },
      y: { type: 'linear', min: 0, max: 100 },

      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        min: 0,
        max: 1000,
        grid: { drawOnChartArea: false },
      },
    },
  };
  return (
    <>
      <Controls>
        <Range label="Point 크기" value={radius} min={2} max={10} onChange={setRadius} />
      </Controls>
      <ChartCanvas type="line" data={chartData} options={options} {...props} />
    </>
  );
}
