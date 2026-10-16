import { ChartFrame } from '@owp/charts';
import { createCategoryAxisScale, createIntegerAxisScale } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useMemo, useState } from 'react';
import { createHistogram, createMeasurements } from '../model/data';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useChartPalette } from '../model/useCartesian';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [bins, setBins] = useState(8);
  const palette = useChartPalette();
  const measurements = useMemo(() => createMeasurements(600).map((point) => point.value), []);
  const records = useMemo(() => createHistogram(measurements, bins), [measurements, bins]);
  const chart = useCartesian(
    {
      records,
      series: [
        {
          dataKey: 'frequency',
          label: t('빈도'),
          type: 'bar',
          datasetOptions: {
            barPercentage: 1,
            categoryPercentage: 1,
            maxBarThickness: Number.POSITIVE_INFINITY,
            borderRadius: 0,
            borderSkipped: false,
            borderWidth: 1,
            borderColor: palette.surface,
          },
        },
      ],
      options: {
        scales: {
          x: createCategoryAxisScale({
            title: { display: true, text: t('측정값'), color: palette.muted },
            grid: { display: false },
          }),
          y: createIntegerAxisScale({
            beginAtZero: true,
            title: { display: true, text: t('빈도'), color: palette.muted },
          }),
        },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="구간 수" value={bins} min={4} max={16} onChange={setBins} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame {...chart} type="bar" height="100%" legend={false} zoomSlider={{ x: true }} />
      </div>
      <p className="chart-note">
        {t('원본 측정값 {{count}}개의 구간별 분포입니다.', {
          count: measurements.length,
        })}
      </p>
    </>
  );
}
