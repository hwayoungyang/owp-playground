import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Controls, Toggle } from '../runtime/Controls';
import { type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { data, palette } = useNativeData('bar');
  const [enabled, setEnabled] = useState(true);

  const options: NativeOptions = {
    scales: {
      x: { grid: { display: enabled } },
      y: {
        beginAtZero: true,
        grid: {
          display: enabled,
          color: (context) => (context.tick.value === 60 ? palette.colors[1] : palette.line),
        },
      },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="격자 표시" value={enabled} onChange={setEnabled} />
      </Controls>
      <SampleFrame type="bar" data={data} options={options} {...props} />
    </>
  );
}
