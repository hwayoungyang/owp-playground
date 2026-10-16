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
      x: {
        ticks: {
          callback: function (value, index) {
            return enabled && index % 2 ? null : this.getLabelForValue(Number(value));
          },
        },
      },
      y: { beginAtZero: true, ticks: { callback: (value) => `${value}%` } },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="일부 눈금 숨김" value={enabled} onChange={setEnabled} />
      </Controls>
      <SampleFrame type="bar" data={data} options={options} {...props} />
    </>
  );
}
