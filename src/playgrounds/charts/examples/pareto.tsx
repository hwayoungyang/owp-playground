import { ChartFrame } from '@owp/charts';
import { createPareto, createPercentAxisScale } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useChartPalette } from '../model/useCartesian';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [target, setTarget] = useState(true);
  const palette = useChartPalette();
  const rows = createPareto(
    [
      { label: t('표면 흠집'), count: 38 },
      { label: t('치수 편차'), count: 26 },
      { label: t('조립 불량'), count: 17 },
      { label: t('색상 편차'), count: 10 },
      { label: t('포장 손상'), count: 6 },
      { label: t('기타'), count: 3 },
    ],
    (row) => row.count,
  );
  const chart = useCartesian(
    {
      records: rows.map((row) => ({
        category: row.item.label,
        count: row.value,
        cumulative: row.cumulativeRatio * 100,
      })),
      series: [
        {
          dataKey: 'count',
          label: t('발생 건수'),
          type: 'bar',
          datasetOptions: {
            order: 1,
            backgroundColor: rows.map((_, index) => palette.colors[index] ?? palette.ink),
          },
        },
        {
          dataKey: 'cumulative',
          label: t('누적 비율'),
          type: 'line',
          yAxisId: 'y1',
          backgroundColor: palette.ink,
          borderColor: palette.ink,
          datasetOptions: { tension: 0, order: 0, clip: 8 },
        },
      ],
      options: {
        layout: { padding: { top: 24, right: 8 } },
        scales: {
          x: { type: 'category' },
          y: { beginAtZero: true },
          y1: createPercentAxisScale({
            position: 'right',
            min: 0,
            max: 100,
            grid: { drawOnChartArea: false },
          }),
        },
        plugins: {
          annotation: {
            annotations: target
              ? {
                  threshold: {
                    type: 'line',
                    yScaleID: 'y1',
                    yMin: 80,
                    yMax: 80,
                    borderWidth: 1,
                    borderDash: [6, 4],
                    label: { display: true, content: '80%', position: 'start' },
                  },
                }
              : {},
          },
          tooltip: {
            callbacks: {
              label: ({ dataset, parsed }) =>
                `${dataset.label}: ${parsed.y ?? 0}${dataset.yAxisID === 'y1' ? '%' : ''}`,
            },
          },
        },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Toggle label="80% 기준선" value={target} onChange={setTarget} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          {...chart}
          type="bar"
          height="100%"
          interactionLayer={false}
          zoomSlider={false}
        />
      </div>
    </>
  );
}
