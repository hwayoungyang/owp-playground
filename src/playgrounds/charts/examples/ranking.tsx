import { ChartFrame } from '@owp/charts';
import type { ChartDataLabelsContext } from '@owp/charts/types';
import {
  createAxisDomain,
  createCategoryAxisScale,
  createLinearAxisScale,
} from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useChartPalette, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [limit, setLimit] = useState(7);
  const palette = useChartPalette();
  const records = useMonthlyRecords()
    .map((row, index) => ({
      ...row,
      colorIndex: index,
      category: t('라인 {{number}}', { number: index + 1 }),
    }))
    .sort((a, b) => Number(b.actual) - Number(a.actual))
    .slice(0, limit)
    .map((row) => ({ ...row, remaining: 160 - Number(row.actual) }));
  const chart = useCartesian(
    {
      records,
      series: [
        {
          dataKey: 'actual',
          label: t('생산량'),
          type: 'bar',
          stack: 'rank',
          datasetOptions: {
            maxBarThickness: 16,
            datalabels: { display: false },
            backgroundColor: records.map(
              (row) => palette.colors[row.colorIndex % palette.colors.length] ?? palette.ink,
            ),
          },
        },
        {
          dataKey: 'remaining',
          label: t('남은 영역'),
          type: 'bar',
          stack: 'rank',
          backgroundColor: palette.line,
          datasetOptions: {
            maxBarThickness: 16,
            datalabels: {
              display: true,
              anchor: 'end',
              align: 'left',
              formatter: (_value: unknown, context: ChartDataLabelsContext) =>
                String(records[context.dataIndex]?.actual ?? ''),
            },
          },
        },
      ],
      options: {
        indexAxis: 'y',
        scales: {
          x: createLinearAxisScale({
            display: false,
            domain: createAxisDomain(0, 160),
            stacked: true,
          }),
          y: createCategoryAxisScale({ stacked: true }),
        },
        plugins: { datalabels: { color: palette.ink } },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시 개수" value={limit} min={3} max={10} onChange={setLimit} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          {...chart}
          type="bar"
          height="100%"
          legend={false}
          zoomSlider={false}
          interactionLayer={false}
          externalTooltip
        />
      </div>
    </>
  );
}
