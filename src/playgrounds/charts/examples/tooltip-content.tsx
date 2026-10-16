import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { data } = useNativeData('bar');
  const [enabled, setEnabled] = useState(true);

  const options: NativeOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.formattedValue}`,
          footer: (items) =>
            enabled
              ? `${t('합계')}: ${items.reduce((sum, item) => sum + (item.parsed.y ?? 0), 0)}`
              : '',
        },
      },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="합계 표시" value={enabled} onChange={setEnabled} />
      </Controls>
      <ChartCanvas type="bar" data={data} options={options} {...props} />
    </>
  );
}
