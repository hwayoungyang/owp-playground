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
  const [tension, setTension] = useState(0.25);
  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [{ dataKey: 'actual', label: t('실적'), type: 'line', datasetOptions: { tension } }],
      options: {},
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시할 월 수" value={count} min={3} max={12} onChange={setCount} />
        <Range
          label="선의 곡률"
          value={tension}
          min={0}
          max={0.5}
          step={0.05}
          onChange={setTension}
        />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame type="line" {...chart} height="100%" />
      </div>
    </>
  );
}
