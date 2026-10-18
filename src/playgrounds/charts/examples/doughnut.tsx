import { OwpRadialChart } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useAreaRadialExample } from '../model/useAreaRadialExample';
import { processOutput, useRadialData } from '../model/useRadialData';
import { Controls, Range, Toggle } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { palette, labels, createItems } = useRadialData();
  const [cutout, setCutout] = useState(60);
  const [empty, setEmpty] = useState(false);
  const rings = [
    {
      id: 'production',
      label: t('생산량'),
      items: createItems(empty ? processOutput.map(() => 0) : processOutput),
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
        <Toggle label="합계 0으로 표시" value={empty} onChange={setEmpty} />
      </Controls>
      <div ref={chart.plot} className={chart.className}>
        <OwpRadialChart
          rings={rings}
          cutout={`${cutout}%`}
          emptyState
          outsideLabels
          options={chart.options}
          {...chart.frame}
        />
      </div>
    </>
  );
}
