import { ChartFrame } from '@owp/charts';
import { createCategoryAxisScale, createNumberAxisScale } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import { createBarSegmentLabels } from '../model/barSegmentLabels';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useChartPalette, useMonthlyRecords } from '../model/useCartesian';
import { Controls, Range, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(12);
  const [labels, setLabels] = useState(false);
  const palette = useChartPalette();
  const allRecords = useMonthlyRecords();

  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [
        { dataKey: 'lineA', label: t('라인 A'), type: 'bar', stack: 'output' },
        { dataKey: 'lineB', label: t('라인 B'), type: 'bar', stack: 'output' },
        { dataKey: 'lineC', label: t('라인 C'), type: 'bar', stack: 'output' },
      ],
      options: {
        plugins: { datalabels: createBarSegmentLabels({ enabled: labels, palette }) },
        scales: {
          x: createCategoryAxisScale({ stacked: true }),
          y: createNumberAxisScale({ stacked: true, beginAtZero: true }),
        },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시할 월 수" value={count} min={3} max={12} onChange={setCount} />
        <Toggle label="구간 값 표시" value={labels} onChange={setLabels} />
      </Controls>
      {labels && <p className="chart-note">{t('안쪽 라벨은 막대 안에 들어갈 때만 표시합니다.')}</p>}
      <div className="chart-canvas">
        <ChartFrame type="bar" {...chart} height="100%" />
      </div>
    </>
  );
}
