import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Choice, Controls } from '../runtime/Controls';
import { type NativeOptions, SampleFrame } from '../runtime/SampleFrame';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { data } = useNativeData('bar');
  const [mode, setMode] = useState<'start' | 'center' | 'end'>('start');

  const options: NativeOptions = {
    plugins: {
      title: {
        display: true,
        align: mode,
        text: [t('월별 생산량'), t('라인별 비교')],
        font: { size: 14 },
        padding: { top: 0, bottom: 16 },
      },
    },
  };
  return (
    <>
      <Controls>
        <Choice
          label="제목 정렬"
          value={mode}
          options={['start', 'center', 'end']}
          onChange={setMode}
        />
      </Controls>
      <SampleFrame type="bar" data={data} options={options} {...props} />
    </>
  );
}
