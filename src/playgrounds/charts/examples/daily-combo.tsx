import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useMemo, useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import { createProcessSeries } from '../model/factoryData';
import type { ChartExampleProps } from '../model/types';
import { useChartPalette } from '../model/useCartesian';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

const hourly = createProcessSeries({
  anchors: [10.6, 9.8, 12.4, 9.2, 11.7, 10.8, 9.6, 8.8, 7.2, 9.5, 10.2],
  count: 240,
  seed: 78,
  volatility: 0.9,
}).map((y, index) => ({ x: index / 24, y }));
const daily = Array.from({ length: 10 }, (_, day) => ({
  x: day + 0.5,
  y: hourly.slice(day * 24, day * 24 + 24).reduce((sum, point) => sum + point.y, 0) / 24,
}));
export function ChartExample(props: ChartExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const palette = useChartPalette();
  const [average, setAverage] = useState(true);
  const date = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
  const stamp = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  const instant = (x: number) => Date.UTC(2026, 9, 4) + x * 86_400_000;
  const data: NativeData = {
    datasets: [
      {
        id: 'daily-average',
        type: 'bar',
        label: t('일별 평균'),
        data: daily,
        backgroundColor: palette.colors[1],
        hidden: !average,
        barThickness: 'flex',
        categoryPercentage: 1,
        barPercentage: 0.86,
        borderRadius: 0,
        order: 1,
      },
      {
        id: 'hourly-vibration',
        type: 'line',
        label: t('시간별 진동'),
        data: hourly,
        borderColor: palette.colors[0],
        backgroundColor: palette.colors[0],
        pointRadius: 0,
        borderWidth: 1.5,
        tension: 0,
        order: 0,
      },
    ],
  };
  const options: NativeOptions = {
    interaction: { mode: 'nearest', intersect: false },
    scales: {
      x: {
        type: 'linear',
        min: 0,
        max: 10,
        ticks: { stepSize: 1, callback: (value) => date.format(instant(Number(value))) },
      },
      y: { type: 'linear', min: 4, max: 16 },
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (items) => stamp.format(instant(items[0]?.parsed.x ?? 0)),
          label: (item) => `${item.dataset.label}: ${(item.parsed.y ?? 0).toFixed(2)}`,
        },
      },
    },
  };
  const snapshot = useMemo(
    () => ({
      labels: hourly.map((point) =>
        new Date(Date.UTC(2026, 9, 4) + point.x * 86_400_000).toISOString(),
      ),
      series: [
        { label: t('시간별 진동'), values: hourly.map((point) => point.y) },
        {
          label: t('일별 평균'),
          values: hourly.map((_, index) =>
            average ? (daily[Math.floor(index / 24)]?.y ?? null) : null,
          ),
        },
      ],
    }),
    [t, average],
  );
  useEffect(() => props.onData?.(snapshot), [props.onData, snapshot]);
  return (
    <>
      <Controls>
        <Toggle label="일별 평균 표시" value={average} onChange={setAverage} />
      </Controls>
      <ChartCanvas type="bar" data={data} options={options} onRecord={props.onRecord} />
    </>
  );
}
