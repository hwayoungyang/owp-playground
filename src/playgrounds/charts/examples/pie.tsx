import { OwpRadialChart } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useAreaRadialExample } from '../model/useAreaRadialExample';
import { processOutput, useRadialData } from '../model/useRadialData';
import { Controls, Range, Toggle } from '../runtime/Controls';
import { ThresholdExplanation } from '../runtime/ThresholdExplanation';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const { palette, labels, createItems } = useRadialData();
  const [value, setValue] = useState(0);
  const [conditionalColors, setConditionalColors] = useState(false);
  const [threshold, setThreshold] = useState(500);
  const rings = [
    {
      id: 'production',
      label: t('생산량'),
      items: createItems(
        processOutput,
        conditionalColors
          ? processOutput.map(
              (output) => palette.colors[output >= threshold ? 0 : 1] ?? palette.ink,
            )
          : palette.colors,
      ),
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
        <Toggle
          label="기준값으로 색상 구분"
          value={conditionalColors}
          onChange={setConditionalColors}
        />
        {conditionalColors && (
          <Range
            label="생산량 기준값 (개)"
            value={threshold}
            min={100}
            max={1600}
            step={100}
            onChange={setThreshold}
          />
        )}
      </Controls>
      {conditionalColors && <ThresholdExplanation value={threshold} kind="pie" />}
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
