import { Button } from '@mui/material';
import { OwpLiveChart } from '@owp/charts';
import type { OwpLiveChartProps } from '@owp/charts/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { factoryNoise } from '../model/factoryData';
import type { ChartExampleProps } from '../model/types';
import { useChartPalette } from '../model/useCartesian';
import { Controls, Range } from '../runtime/Controls';
import { useAvailableChartHeight } from '../runtime/useAvailableChartHeight';
import { usePageVisible } from '../runtime/usePageVisible';

const axisLayout = { labelWidth: 56, height: 32 } as const;

const reading = (sequence: number) =>
  Number(
    (
      60 +
      15 * Math.sin(sequence * 0.11) +
      8 * Math.cos(sequence * 0.037) +
      factoryNoise(sequence, 90) * 3
    ).toFixed(2),
  );

export function ChartExample(props: ChartExampleProps) {
  const { onData } = props;
  const { t, i18n } = useOwpTranslation();
  const palette = useChartPalette();
  const [running, setRunning] = useState(true);
  const visible = usePageVisible();
  const [count, setCount] = useState(30);
  const plot = useAvailableChartHeight();
  const [points, setPoints] = useState(() => {
    const now = Date.now();
    return Array.from({ length: 61 }, (_, index) => ({
      sequence: index - 1,
      timestamp: now - (60 - index) * 1000,
      value: reading(index - 1),
    }));
  });
  const append = useCallback(() => {
    const receivedAt = Date.now();
    setPoints((previous) => {
      const last = previous.at(-1);
      const sequence = (last?.sequence ?? 0) + 1;
      return [
        ...previous.slice(-60),
        {
          sequence,
          timestamp: Math.max(receivedAt, (last?.timestamp ?? 0) + 1000),
          value: reading(sequence),
        },
      ];
    });
  }, []);
  useEffect(() => {
    if (!running || !visible) return;
    const timer = window.setInterval(append, 1000);
    return () => window.clearInterval(timer);
  }, [running, visible, append]);
  const time = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }),
    [i18n.language],
  );
  const tickTime = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { minute: '2-digit', second: '2-digit' }),
    [i18n.language],
  );
  const series = useMemo(
    () => [
      {
        id: 'reading',
        label: t('측정값'),
        color: palette.colors[0],
        data: points.map((point) => ({ x: point.timestamp, y: point.value })),
      },
    ],
    [points, palette.colors, t],
  );
  useEffect(
    () =>
      onData?.({
        labels: points.slice(-count).map((point) => time.format(point.timestamp)),
        series: [{ label: t('측정값'), values: points.slice(-count).map((point) => point.value) }],
      }),
    [points, count, time, t, onData],
  );
  const options = useMemo<OwpLiveChartProps['options']>(
    () => ({
      parsing: false,
      scales: {
        x: {
          type: 'linear',
          bounds: 'data',
          ticks: {
            maxTicksLimit: 16,
            autoSkip: false,
            autoSkipPadding: 8,
            includeBounds: false,
            callback: (value) => tickTime.format(Number(value)),
          },
        },
        y: { type: 'linear', min: 0, max: 100 },
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) => {
              const timestamp = items[0]?.parsed.x;
              return timestamp == null ? '' : time.format(timestamp);
            },
          },
        },
      },
    }),
    [time, tickTime],
  );
  return (
    <>
      <Controls>
        <Button
          variant="outlined"
          onClick={() => {
            setRunning((current) => !current);
            props.onRecord?.('stream', running ? 'paused' : 'running');
          }}
        >
          {t(running ? '일시정지' : '다시 시작')}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            append();
            props.onRecord?.('append', '1');
          }}
        >
          {t('데이터 추가')}
        </Button>
        <Range
          label="표시할 데이터 수"
          value={count}
          min={10}
          max={60}
          step={10}
          onChange={(value) => {
            setCount(value);
          }}
        />
        <span className="chart-note" role="status">
          {t(running ? '자동 갱신 중' : '일시정지됨')}
        </span>
      </Controls>
      <div ref={plot} className="chart-canvas chart-native">
        <OwpLiveChart
          series={series}
          window={{
            range: (count - 1) * 1000,
            maxDataPoints: 61,
            transition: 1000,
            tickSpacing: 48,
            maxTicks: 16,
            tickOrigin: 0,
            axisLayout,
          }}
          paused={!running || !visible}
          legend={{
            position: 'bottom',
            align: 'center',
            onClick: (item) => props.onRecord?.('legend-click', String(item.label)),
          }}
          options={options}
          height="100%"
          showExportButton={false}
          aria-label={t('차트입니다. 데이터 탭에서 값을 확인할 수 있습니다.')}
        />
      </div>
    </>
  );
}
