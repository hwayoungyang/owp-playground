import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useNativeData } from '../model/useNativeData';
import { Choice, Controls, Toggle } from '../runtime/Controls';
import { LegendPreview } from '../runtime/LegendPreview';

const titleAlignment = { 왼쪽: 'left', 가운데: 'center', 오른쪽: 'right' } as const;

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { data } = useNativeData('bar');
  const [enabled, setEnabled] = useState(true);
  const [alignment, setAlignment] = useState<keyof typeof titleAlignment>('가운데');
  return (
    <>
      <Controls>
        <Toggle label="범례 제목 표시" value={enabled} onChange={setEnabled} />
        {enabled && (
          <Choice
            label="제목 정렬"
            value={alignment}
            options={['왼쪽', '가운데', '오른쪽']}
            onChange={setAlignment}
          />
        )}
      </Controls>
      <LegendPreview
        data={data}
        title={enabled ? t('생산 라인') : undefined}
        titleAlign={titleAlignment[alignment]}
        {...props}
      />
    </>
  );
}
