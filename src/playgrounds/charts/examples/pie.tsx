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
  const [value, setValue] = useState(0);
  const rings = [
    {
      id: 'production',
      label: t('생산량'),
      items: createItems(processOutput),
      datasetOptions: {
        borderWidth: 1,
        borderColor: palette.surface,
        borderRadius: 0,
        spacing: 0,
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
        <Range label="회전 각도" value={value} min={0} max={360} step={15} onChange={setValue} />
      </Controls>
      <div ref={chart.plot} className={chart.className}>
        <OwpRadialChart
          rings={rings}
          variant="pie"
          rotation={value}
          outsideLabels
          options={chart.options}
          {...chart.frame}
        />
      </div>
    </>
  );
}
