import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Controls, Toggle } from '../runtime/Controls';
import { type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('bar');
  const [enabled, setEnabled] = useState(true);

  const options: NativeOptions = {
    scales: {
      x: { type: 'category' },
      y: enabled ? { min: 20, max: 80 } : { suggestedMin: 20, suggestedMax: 80 },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="고정 범위" value={enabled} onChange={setEnabled} />
      </Controls>
      <SampleFrame type="bar" data={data} options={options} {...props} />
    </>
  );
}
