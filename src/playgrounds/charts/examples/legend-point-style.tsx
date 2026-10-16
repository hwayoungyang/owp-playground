import { useState } from 'react';
import type { NativeData } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('line');
  const [enabled, setEnabled] = useState(true);

  const chartData: NativeData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      pointRadius: enabled ? 3 + index : 0,
    })),
  };
  return (
    <>
      <Controls>
        <Toggle label="Point 표시 범례" value={enabled} onChange={setEnabled} />
      </Controls>
      <ChartCanvas type="line" data={chartData} {...props} />
    </>
  );
}
