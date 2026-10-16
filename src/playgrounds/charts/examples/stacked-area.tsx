import { alpha } from '@mui/material/styles';
import { OwpAreaChart } from '@owp/charts';
import type { OwpAreaChartProps } from '@owp/charts/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import { createProcessSeries } from '../model/factoryData';
import type { ChartExampleProps } from '../model/types';
import { useAreaRadialExample } from '../model/useAreaRadialExample';
import { useChartPalette } from '../model/useCartesian';
import { Controls, Toggle } from '../runtime/Controls';

const labels = Array.from({ length: 132 }, (_, index) =>
  new Date(Date.UTC(2026, 4, 1 + index)).toISOString().slice(0, 10),
);
const counts = [
  createProcessSeries({
    anchors: [590, 630, 610, 655, 640, 460, 430, 475, 380, 395, 310, 285, 320, 300],
    count: 132,
    seed: 8,
    volatility: 7,
  }),
  createProcessSeries({
    anchors: [265, 280, 270, 295, 285, 230, 245, 250, 225, 210, 115, 95, 130, 118],
    count: 132,
    seed: 21,
    volatility: 5,
  }),
  createProcessSeries({
    anchors: [50, 62, 55, 48, 57, 45, 40, 52, 42, 38, 35, 40, 48, 45],
    count: 132,
    seed: 49,
    volatility: 2.5,
  }),
] as const;

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const [annotations, setAnnotations] = useState(true);
  const names = [t('라인 A'), t('라인 B'), t('라인 C')];
  const series: OwpAreaChartProps['series'] = counts.map((values, index) => ({
    id: `line-${index}`,
    label: names[index] ?? '',
    values,
    stack: 'production',
    color: palette.colors[index],
    opacity: 0.42,
    datasetOptions: { borderWidth: 1.5 },
  }));
  const chart = useAreaRadialExample(
    {
      labels,
      series: series.map((item) => ({
        label: item.label,
        values: item.values,
      })),
    },
    props,
  );
  const options: OwpAreaChartProps['options'] = {
    ...chart.options,
    scales: {
      x: {
        type: 'category',
        ticks: {
          autoSkip: true,
          autoSkipPadding: 20,
          maxTicksLimit: 8,
          maxRotation: 0,
        },
      },
      y: { stacked: true, min: 0, suggestedMax: 1100 },
    },
    plugins: {
      annotation: {
        annotations: annotations
          ? {
              policy: {
                type: 'line',
                xMin: '2026-06-16',
                xMax: '2026-06-16',
                borderColor: palette.muted,
                borderWidth: 1,
                borderDash: [4, 4],
                label: {
                  display: true,
                  content: t('품목 전환'),
                  position: 'start',
                  rotation: 90,
                  backgroundColor: alpha(palette.surface, 0.85),
                  color: palette.ink,
                },
              },
              fee: {
                type: 'line',
                xMin: '2026-07-30',
                xMax: '2026-07-30',
                borderColor: palette.muted,
                borderWidth: 1,
                borderDash: [4, 4],
                label: {
                  display: true,
                  content: t('정기 점검'),
                  position: 'start',
                  rotation: 90,
                  backgroundColor: alpha(palette.surface, 0.85),
                  color: palette.ink,
                },
              },
            }
          : {},
      },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="주요 시점 표시" value={annotations} onChange={setAnnotations} />
      </Controls>
      <div ref={chart.plot} className={chart.className}>
        <OwpAreaChart labels={labels} series={series} stacked options={options} {...chart.frame} />
      </div>
    </>
  );
}
