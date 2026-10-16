import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data } = useNativeData('bar');
  const [enabled, setEnabled] = useState(true);
  return (
    <>
      <Controls>
        <Toggle label="Hover 이벤트" value={enabled} onChange={setEnabled} />
      </Controls>
      <ChartCanvas type="bar" data={data} recordLegendHover={enabled} {...props} />
    </>
  );
}
