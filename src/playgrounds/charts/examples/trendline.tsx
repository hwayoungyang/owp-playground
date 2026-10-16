import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useChartPalette, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(12);
  const allRecords = useMonthlyRecords();
  const palette = useChartPalette();
  const [show, setShow] = useState(true);
  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [
        {
          dataKey: 'actual',
          label: t('실적'),
          type: 'bar',
          datasetOptions: {
            trendlineLinear: show
              ? {
                  colorMin: palette.danger,
                  lineStyle: 'dashed',
                  width: 2,
                  label: { display: true, text: t('실적 추세'), color: palette.ink },
                }
              : undefined,
          },
        },
      ],
      options: {},
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시할 월 수" value={count} min={3} max={12} onChange={setCount} />
        <Toggle label="추세선 표시" value={show} onChange={setShow} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame type="bar" {...chart} height="100%" />
      </div>
    </>
  );
}
