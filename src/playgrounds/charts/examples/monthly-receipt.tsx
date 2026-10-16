import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(12);
  const allRecords = useMonthlyRecords();

  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [
        { dataKey: 'lineA', label: t('자재 A'), type: 'bar' },
        { dataKey: 'lineB', label: t('자재 B'), type: 'bar' },
        { dataKey: 'lineC', label: t('자재 C'), type: 'bar' },
      ],
      options: {},
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시할 월 수" value={count} min={3} max={12} onChange={setCount} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame type="bar" {...chart} height="100%" zoomSlider={{ x: true }} />
      </div>
    </>
  );
}
