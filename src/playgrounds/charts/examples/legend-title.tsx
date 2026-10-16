import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Controls, Toggle } from '../runtime/Controls';
import { type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { data, palette } = useNativeData('bar');
  const [enabled, setEnabled] = useState(true);

  const options: NativeOptions = {
    plugins: {
      legend: { title: { display: enabled, text: t('생산 라인'), color: palette.ink, padding: 8 } },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="범례 제목 표시" value={enabled} onChange={setEnabled} />
      </Controls>
      <SampleFrame type="bar" data={data} options={options} {...props} />
    </>
  );
}
