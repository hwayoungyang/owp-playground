import { useMediaQuery } from '@mui/material';
import { ChartFrame } from '@owp/charts';
import {
  createCategoryAxisScale,
  createLinearAxisScale,
  downsampleMinMax,
} from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useMemo, useState } from 'react';
import { createMeasurements } from '../model/data';
import type { ChartExampleProps } from '../model/types';
import { useCartesian } from '../model/useCartesian';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const narrow = useMediaQuery('(max-width: 599px)');
  const [count, setCount] = useState(10000);
  const [limit, setLimit] = useState(600);
  const points = useMemo(() => createMeasurements(count), [count]);
  const rendered = useMemo(
    () => downsampleMinMax(points, limit, (point) => point.value),
    [points, limit],
  );
  const records = useMemo(
    () =>
      rendered.map((point) => ({
        category: new Date(point.timestamp).toISOString(),
        value: point.value,
      })),
    [rendered],
  );
  const timeFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
      }),
    [i18n.language],
  );
  const tooltipFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'UTC',
      }),
    [i18n.language],
  );
  const chart = useCartesian(
    {
      records,
      series: [
        {
          dataKey: 'value',
          label: t('측정값'),
          type: 'line',
          datasetOptions: { pointRadius: 0, tension: 0, borderWidth: 1.5 },
        },
      ],
      options: {
        animation: false,
        plugins: {
          tooltip: {
            callbacks: {
              title: (items) => {
                const point = rendered[items[0]?.dataIndex ?? -1];
                return point ? tooltipFormat.format(point.timestamp) : '';
              },
            },
          },
        },
        scales: {
          x: createCategoryAxisScale({
            ticks: {
              maxRotation: 0,
              maxTicksLimit: narrow ? 3 : 6,
              autoSkipPadding: 12,
              callback: (value: string | number) => {
                const point = rendered[Number(value)];
                return point ? timeFormat.format(point.timestamp) : '';
              },
            },
          }),
          y: createLinearAxisScale({ beginAtZero: false }),
        },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range
          label="원본 데이터 수"
          value={count}
          min={1000}
          max={50000}
          step={1000}
          onChange={setCount}
        />
        <Range
          label="최대 표시 데이터 수"
          value={limit}
          min={100}
          max={1200}
          step={100}
          onChange={setLimit}
        />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          {...chart}
          type="line"
          height="100%"
          externalTooltip
          interactionLayer={false}
          legend={false}
          zoomSlider={{ x: true }}
        />
      </div>
      <p className="chart-note">
        {t('원본 {{original}}개 → 표시 {{rendered}}개 · min/max 다운샘플링', {
          original: count,
          rendered: rendered.length,
        })}
      </p>
    </>
  );
}
