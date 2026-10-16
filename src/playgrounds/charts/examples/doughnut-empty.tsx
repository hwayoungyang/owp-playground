import { OwpRadialChart } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import { monthlyRecords } from '../model/data';
import type { ChartExampleProps } from '../model/types';
import { useAreaRadialExample } from '../model/useAreaRadialExample';
import { useChartPalette } from '../model/useCartesian';
import { Controls, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const [empty, setEmpty] = useState(false);
  const labels = Array.from({ length: 6 }, (_, index) => t('{{month}}월', { month: index + 1 }));
  const rings = [
    {
      id: 'line-a',
      label: t('라인 A'),
      items: monthlyRecords.slice(0, 6).map((row, index) => ({
        id: `month-${index + 1}`,
        label: labels[index] ?? '',
        value: empty ? 0 : row.lineA,
        color: palette.colors[index],
      })),
      datasetOptions: {
        borderColor: palette.colors[0],
        borderWidth: 0,
        borderRadius: 4,
      },
    },
  ];
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
  return (
    <>
      <Controls>
        <Toggle label="합계 0으로 표시" value={empty} onChange={setEmpty} />
      </Controls>
      <div ref={chart.plot} className={chart.className}>
        <OwpRadialChart
          rings={rings}
          cutout="50%"
          emptyState
          options={chart.options}
          {...chart.frame}
        />
      </div>
    </>
  );
}
