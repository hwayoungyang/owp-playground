import { useState } from 'react';
import type { NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { data, palette } = useNativeData();
  const [dashed, setDashed] = useState(true);
  const options: NativeOptions = {
    plugins: {
      annotation: {
        annotations: {
          plotBorder: {
            type: 'box',
            backgroundColor: 'transparent',
            borderColor: palette.colors[0] ?? palette.ink,
            borderWidth: 2,
            borderDash: dashed ? [6, 4] : [],
            drawTime: 'afterDraw',
          },
        },
      },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="점선 테두리" value={dashed} onChange={setDashed} />
      </Controls>
      <ChartCanvas type="bar" data={data} options={options} {...props} />
    </>
  );
}
