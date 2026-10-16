import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(12);
  const allRecords = useMonthlyRecords();
  const [enabled, setEnabled] = useState(true);
  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [
        { dataKey: 'lineA', label: t('라인 A'), type: 'line' },
        { dataKey: 'lineB', label: t('라인 B'), type: 'line' },
        { dataKey: 'lineC', label: t('라인 C'), type: 'line' },
      ],
      options: {},
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시할 월 수" value={count} min={3} max={12} onChange={setCount} />
        <Toggle label="휠·pinch 확대" value={enabled} onChange={setEnabled} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          type="line"
          {...chart}
          height="100%"
          interactionLayer={{
            dragZoom: {
              enabled,
              mode: 'x',
              drag: false,
              wheel: { enabled, modifierKey: 'ctrl' },
              pinch: { enabled },
            },
          }}
        />
      </div>
      <p className="chart-note">
        {t('Ctrl 키를 누른 채 휠을 움직이거나 터치 화면에서 두 손가락으로 확대합니다.')}
      </p>{' '}
    </>
  );
}
