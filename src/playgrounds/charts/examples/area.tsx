import { alpha } from '@mui/material/styles';
import { OwpAreaChart } from '@owp/charts';
import type { OwpAreaChartProps } from '@owp/charts/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import { areaReadings } from '../model/referenceData';
import type { ChartExampleProps } from '../model/types';
import { useAreaRadialExample } from '../model/useAreaRadialExample';
import { useChartPalette } from '../model/useCartesian';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const palette = useChartPalette();
  const [signed, setSigned] = useState(true);
  const positive = palette.colors[0] ?? palette.ink;
  const format = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
  const labels = areaReadings.map(({ day }) => format.format(Date.UTC(2026, 4, 1 + day)));
  const series: OwpAreaChartProps['series'] = [
    {
      id: 'production-difference',
      label: t('목표 대비 생산량 차이'),
      values: areaReadings.map(({ value }) => value),
      color: positive,
      above: alpha(positive, 0.42),
      below: signed ? alpha(palette.danger, 0.48) : alpha(positive, 0.42),
      datasetOptions: {
        segment: {
          borderColor: (context) =>
            signed && ((context.p0.parsed.y ?? 0) + (context.p1.parsed.y ?? 0)) / 2 < 0
              ? palette.danger
              : positive,
        },
      },
    },
  ];
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
        grid: { display: false },
        ticks: {
          autoSkip: true,
          autoSkipPadding: 20,
          maxTicksLimit: 6,
          maxRotation: 0,
        },
      },
      y: { min: -60, max: 80 },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="양수·음수 색상 구분" value={signed} onChange={setSigned} />
      </Controls>
      <div ref={chart.plot} className={chart.className}>
        <OwpAreaChart labels={labels} series={series} options={options} {...chart.frame} />
      </div>
    </>
  );
}
