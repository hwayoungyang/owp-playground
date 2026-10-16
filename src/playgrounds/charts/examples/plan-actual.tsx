import { ChartFrame } from '@owp/charts';
import {
  createAxisDomain,
  createCategoryAxisScale,
  createNumberAxisScale,
  createPercentAxisScale,
  createZoomSliderAxis,
} from '@owp/charts/utils';
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
  const [labels, setLabels] = useState(false);
  const axisOptions = {
    scales: {
      x: createCategoryAxisScale(),
      amount: createNumberAxisScale({ beginAtZero: true, position: 'left' }),
      rate: createPercentAxisScale({
        domain: createAxisDomain(0, 140),
        position: 'right',
        grid: { drawOnChartArea: false },
      }),
    },
  };
  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [
        {
          dataKey: 'plan',
          label: t('계획'),
          type: 'bar',
          yAxisId: 'amount',
          order: 1,
          datasetOptions: { datalabels: { display: labels } },
        },
        {
          dataKey: 'actual',
          label: t('실적'),
          type: 'bar',
          yAxisId: 'amount',
          order: 1,
          datasetOptions: {
            datalabels: { display: labels },
            trendlineLinear: { colorMin: palette.danger, lineStyle: 'dashed', width: 2 },
          },
        },
        {
          dataKey: 'rate',
          label: t('달성률'),
          type: 'line',
          yAxisId: 'rate',
          order: 0,
          datasetOptions: { datalabels: { display: false } },
        },
      ],
      options: {
        ...axisOptions,
        plugins: {
          datalabels: {
            color: palette.ink,
            anchor: 'end',
            align: 'end',
            formatter: (value: number) => String(value),
          },
        },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시할 월 수" value={count} min={3} max={12} onChange={setCount} />
        <Toggle label="값 표시" value={labels} onChange={setLabels} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          type="bar"
          {...chart}
          height="100%"
          zoomSlider={{
            x: true,
            y1: createZoomSliderAxis({ domain: createAxisDomain(0, 160), scaleId: 'amount' }),
            y2: createZoomSliderAxis({
              domain: createAxisDomain(0, 140),
              scaleId: 'rate',
              position: 'right',
            }),
          }}
        />
      </div>
    </>
  );
}
