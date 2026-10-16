import { ChartFrame } from '@owp/charts';
import { createCategoryAxisScale, createNumberAxisScale } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useMemo, useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const [count, setCount] = useState(12);
  const allRecords = useMonthlyRecords();
  const [seconds, setSeconds] = useState(false);
  const timeFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(
        i18n.language,
        seconds
          ? { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }
          : { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' },
      ),
    [i18n.language, seconds],
  );
  const records = allRecords.slice(0, count).map((row, index) => ({
    ...row,
    category: new Date(Date.UTC(2026, 0, 1, 8, index * 5)).toISOString(),
  }));
  const chart = useCartesian(
    {
      records,
      series: [{ dataKey: 'actual', label: t('측정값'), type: 'line' }],
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              title: (items) => {
                const label = items[0]?.label;
                return label ? timeFormat.format(new Date(label)) : '';
              },
            },
          },
        },
        scales: {
          x: createCategoryAxisScale({
            ticks: {
              maxRotation: 0,
              maxTicksLimit: 6,
              callback: (value: string | number) =>
                timeFormat.format(new Date(Date.UTC(2026, 0, 1, 8, Number(value) * 5))),
            },
          }),
          y: createNumberAxisScale(),
        },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시 개수" value={count} min={3} max={12} onChange={setCount} />
        <Toggle label="초 단위 표시" value={seconds} onChange={setSeconds} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame type="line" {...chart} height="100%" />
      </div>
    </>
  );
}
