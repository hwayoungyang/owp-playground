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
  const formats = useMemo(
    () => ({
      date: new Intl.DateTimeFormat(i18n.language, {
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC',
      }),
      time: new Intl.DateTimeFormat(i18n.language, {
        hourCycle: 'h23',
        hour: '2-digit',
        minute: '2-digit',
        ...(seconds ? ({ second: '2-digit' } as const) : {}),
        timeZone: 'UTC',
      }),
      full: new Intl.DateTimeFormat(i18n.language, {
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        ...(seconds ? ({ second: '2-digit' } as const) : {}),
        timeZone: 'UTC',
      }),
    }),
    [i18n.language, seconds],
  );
  const records = allRecords.slice(0, count).map((row, index) => ({
    ...row,
    category: new Date(Date.UTC(2026, 0, 1, 8 + index * 6, 0, (index * 7) % 60)).toISOString(),
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
                return label ? formats.full.format(new Date(label)) : '';
              },
            },
          },
        },
        scales: {
          x: createCategoryAxisScale({
            ticks: {
              maxRotation: 0,
              maxTicksLimit: 6,
              autoSkipPadding: 16,
              callback: (value: string | number) => {
                const label = records[Number(value)]?.category;
                if (!label) return '';
                const timestamp = new Date(label);
                return [formats.date.format(timestamp), formats.time.format(timestamp)];
              },
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
        <Range label="표시할 데이터 수" value={count} min={3} max={12} onChange={setCount} />
        <Toggle label="초 단위 표시" value={seconds} onChange={setSeconds} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame type="line" {...chart} height="100%" />
      </div>
    </>
  );
}
