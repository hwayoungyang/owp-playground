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
        <Toggle label="드래그 확대" value={enabled} onChange={setEnabled} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          type="line"
          {...chart}
          height="100%"
          interactionLayer={{ dragZoom: { enabled, mode: 'x', wheel: false, pinch: false } }}
        />
      </div>
      <p className="chart-note">
        {t('차트 안을 드래그해 확대합니다. 확대 후 초기화 아이콘이 표시됩니다.')}
      </p>{' '}
    </>
  );
}
