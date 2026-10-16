import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Controls, Toggle } from '../runtime/Controls';
import { type NativeData, type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { data, palette } = useNativeData('line');
  const [enabled, setEnabled] = useState(true);

  const sample: NativeData = {
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
      <SampleFrame type="line" data={sample} options={options} {...props} />
    </>
  );
}
