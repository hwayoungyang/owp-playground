import { alpha } from '@mui/material/styles';
import { OwpRadialChart } from '@owp/charts';
import type { OwpRadialChartProps } from '@owp/charts/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useAreaRadialExample } from '../model/useAreaRadialExample';
import { previousOutput, processOutput, useRadialData } from '../model/useRadialData';
import { Controls, Range, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { palette, labels, createItems } = useRadialData();
  const [value, setValue] = useState(40);
  const [itemLegend, setItemLegend] = useState(false);
  const rings = [
    { id: '2026', label: '2026', items: createItems(processOutput) },
    {
      id: '2025',
      label: '2025',
      items: createItems(
        previousOutput,
        palette.colors.map((color) => alpha(color, 0.72)),
      ),
    },
  ].map((ring) => ({
    ...ring,
    datasetOptions: {
      borderWidth: 1.5,
      borderColor: palette.surface,
      borderRadius: 0,
      spacing: 0,
    },
  }));
  const chart = useAreaRadialExample(
    {
      labels,
      series: rings.map((ring) => ({
        label: ring.label,
        values: ring.items.map((item) => item.value),
      })),
    },
    props,
    true,
  );
  const options: OwpRadialChartProps['options'] = {
    ...chart.options,
    plugins: {
      legend: {
        title: {
          display: true,
          text: t('바깥쪽 · {{outer}} / 안쪽 · {{inner}}', {
            outer: '2026',
            inner: '2025',
          }),
          color: palette.muted,
          font: { size: 12, weight: 'normal' },
          padding: 8,
        },
      },
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label ?? '',
          label: ({ dataset, formattedValue }) =>
            t('{{series}}: {{value}}', {
              series: dataset.label,
              value: formattedValue,
            }),
        },
      },
    },
  };
  return (
    <>
      <Controls>
        <Range label="안쪽 비율" value={value} min={0} max={70} step={5} onChange={setValue} />
        <Toggle label="항목별 범례" value={itemLegend} onChange={setItemLegend} />
      </Controls>
      <div ref={chart.plot} className={chart.className}>
        <OwpRadialChart
          rings={rings}
          cutout={`${value}%`}
          outsideLabels
          options={options}
          {...chart.frame}
          legend={{
            ...chart.frame.legend,
            mode: itemLegend ? 'both' : 'series',
            title: t('바깥쪽 · {{outer}} / 안쪽 · {{inner}}', {
              outer: '2026',
              inner: '2025',
            }),
          }}
        />
      </div>
    </>
  );
}
