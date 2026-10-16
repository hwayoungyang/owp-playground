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
    ...data,
    datasets: [
      {
        ...data.datasets[0],
        data: [32, 64, null, 82, 56, 72],
        spanGaps: enabled,
        segment: {
          borderColor: (context) =>
            context.p0.parsed.y !== null &&
            context.p1.parsed.y !== null &&
            context.p0.parsed.y > context.p1.parsed.y
              ? palette.danger
              : palette.colors[0],
          borderDash: (context) => (context.p0.skip || context.p1.skip ? [5, 5] : undefined),
        },
      },
    ],
  };
  const options: NativeOptions = {};
  return (
    <>
      <Controls>
        <Toggle label="누락 구간 연결" value={enabled} onChange={setEnabled} />
      </Controls>
      <ChartCanvas type="line" data={chartData} options={options} {...props} />
    </>
  );
}
