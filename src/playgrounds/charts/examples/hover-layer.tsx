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
  const [area, setArea] = useState(true);
  const [line, setLine] = useState(true);
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
        <Toggle label="hover 영역 표시" value={area} onChange={setArea} />
        <Toggle label="기준선 표시" value={line} onChange={setLine} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          type="line"
          {...chart}
          height="100%"
          interactionLayer={{ showHoverArea: area, showReferenceLine: line }}
        />
      </div>
    </>
  );
}
