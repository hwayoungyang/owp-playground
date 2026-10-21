import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data, palette } = useNativeData('line');
  const [enabled, setEnabled] = useState(true);
  const chartData: NativeData = {
    datasets: data.datasets.map((dataset, i) => ({
      ...dataset,
      pointRadius: 5,
      data: [
        { x: -60 + i * 10, y: 55 },
        { x: 35, y: 40 - i * 20 },
        { x: -30, y: -45 + i * 20 },
        { x: 60, y: -55 },
      ],
    })),
  };
  const options: NativeOptions = {
    plugins: {
      annotation: {
        annotations: {
          upperLeft: {
            type: 'box',
            display: enabled,
            xMax: 0,
            yMin: 0,
            borderWidth: 0,
            backgroundColor: alpha(palette.colors[0] ?? palette.ink, 0.1),
            drawTime: 'beforeDatasetsDraw',
          },
          upperRight: {
            type: 'box',
            display: enabled,
            xMin: 0,
            yMin: 0,
            borderWidth: 0,
            backgroundColor: alpha(palette.colors[1] ?? palette.ink, 0.1),
            drawTime: 'beforeDatasetsDraw',
          },
          lowerRight: {
            type: 'box',
            display: enabled,
            xMin: 0,
            yMax: 0,
            borderWidth: 0,
            backgroundColor: alpha(palette.colors[2] ?? palette.ink, 0.1),
            drawTime: 'beforeDatasetsDraw',
          },
          lowerLeft: {
            type: 'box',
            display: enabled,
            xMax: 0,
            yMax: 0,
            borderWidth: 0,
            backgroundColor: alpha(palette.colors[3] ?? palette.ink, 0.1),
            drawTime: 'beforeDatasetsDraw',
          },
        },
      },
    },
    scales: {
      x: { type: 'linear', min: -100, max: 100 },
      y: { type: 'linear', min: -100, max: 100 },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="사분면 배경 표시" value={enabled} onChange={setEnabled} />
      </Controls>
      <ChartCanvas type="scatter" data={chartData} options={options} {...props} />
    </>
  );
}
