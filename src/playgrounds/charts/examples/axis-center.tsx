import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [enabled, setEnabled] = useState(true);

  const chartData: NativeData = {
    labels: [],
    datasets: [
      {
        ...data.datasets[0],
        data: [
          { x: -40, y: -20 },
          { x: -20, y: 30 },
          { x: 0, y: 0 },
          { x: 20, y: 35 },
          { x: 40, y: -15 },
        ],
      },
    ],
  };
  const options: NativeOptions = {
    scales: {
      x: { type: 'linear', min: -50, max: 50, position: enabled ? 'center' : 'bottom' },
      y: { type: 'linear', min: -50, max: 50, position: enabled ? 'center' : 'left' },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="원점에 축 배치" value={enabled} onChange={setEnabled} />
      </Controls>
      <ChartCanvas type="line" data={chartData} options={options} {...props} />
    </>
  );
}
