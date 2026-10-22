import { useMemo, useState } from 'react';
import type { NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Controls, Toggle } from '../runtime/Controls';
import { LegendPreview } from '../runtime/LegendPreview';

export function ChartExample(props: ChartExampleProps) {
  const { data, palette } = useNativeData('bar');
  const [enabled, setEnabled] = useState(true);
  const options = useMemo<NativeOptions>(
    () => ({ datasets: { bar: { hoverBorderColor: palette.ink, hoverBorderWidth: 2 } } }),
    [palette.ink],
  );
  return (
    <>
      <Controls>
        <Toggle label="막대 강조" value={enabled} onChange={setEnabled} />
      </Controls>
      <LegendPreview
        data={data}
        options={options}
        highlightBars={enabled}
        recordLegendHover
        {...props}
      />
    </>
  );
}
