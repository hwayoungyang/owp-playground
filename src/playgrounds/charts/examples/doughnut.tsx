import { OwpRadialChart } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useAreaRadialExample } from '../model/useAreaRadialExample';
import { processOutput, useRadialData } from '../model/useRadialData';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { palette, labels, createItems } = useRadialData();
  const [cutout, setCutout] = useState(60);
  const rings = [
    {
      id: 'production',
      label: t('생산량'),
      items: createItems(processOutput),
      datasetOptions: {
        borderWidth: 1,
        borderColor: palette.surface,
        borderRadius: 9,
        spacing: 1.5,
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
        <Range
          label="도넛 내부 크기"
          value={cutout}
          min={20}
          max={85}
          step={5}
          onChange={setCutout}
        />
      </Controls>
      <div ref={chart.plot} className={chart.className}>
        <OwpRadialChart
          rings={rings}
          cutout={`${cutout}%`}
          outsideLabels
          options={chart.options}
          {...chart.frame}
        />
      </div>
    </>
  );
}
