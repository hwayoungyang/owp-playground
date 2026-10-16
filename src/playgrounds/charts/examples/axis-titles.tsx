import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Choice, Controls } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { data, palette } = useNativeData('bar');
  const [mode, setMode] = useState<'start' | 'center' | 'end'>('start');

  const options: NativeOptions = {
    scales: {
      x: { title: { display: true, text: t('월'), align: mode, color: palette.ink } },
      y: {
        beginAtZero: true,
        title: { display: true, text: t('생산량'), align: mode, color: palette.ink },
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
      <ChartCanvas type="bar" data={data} options={options} {...props} />
    </>
  );
}
