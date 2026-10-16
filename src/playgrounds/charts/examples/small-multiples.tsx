import { ChartFrame } from '@owp/charts';
import {
  createAxisDomain,
  createCategoryAxisScale,
  createIntegerAxisScale,
} from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useState } from 'react';
import { factoryNoise } from '../model/factoryData';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useChartPalette } from '../model/useCartesian';
import { Controls, Range } from '../runtime/Controls';

const equipmentOutput = (value: number, equipment: number, month: number) =>
  Math.max(
    0,
    Math.round(value * (1 - equipment * 0.07) + factoryNoise(month, equipment + 80) * 12),
  );

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(6);
  const palette = useChartPalette();
  const chart = useCartesian(
    {
      options: {
        scales: {
          x: createCategoryAxisScale(),
          y: createIntegerAxisScale({ domain: createAxisDomain(0, 160) }),
        },
      },
    },
    { onRecord: props.onRecord },
  );
  useEffect(() => {
    props.onData?.({
      labels: (chart.data.labels ?? []).map(String),
      series: Array.from({ length: count }, (_, index) => ({
        label: t('설비 {{number}}', { number: index + 1 }),
        values: (chart.data.datasets[0]?.data ?? []).map((value, month) =>
          equipmentOutput(value, index, month),
        ),
      })),
    });
  }, [chart.data, count, props.onData, t]);
  return (
    <>
      <Controls>
        <Range label="설비 수" value={count} min={2} max={6} onChange={setCount} />
      </Controls>
      <div className="chart-small-multiples">
        {['equipment-a', 'equipment-b', 'equipment-c', 'equipment-d', 'equipment-e', 'equipment-f']
          .slice(0, count)
          .map((id, index) => (
            <section className="chart-panel" key={id}>
              <h2>{t('설비 {{number}}', { number: index + 1 })}</h2>
              <div className="chart-canvas">
                <ChartFrame
                  {...chart}
                  data={{
                    ...chart.data,
                    datasets: chart.data.datasets.map((series) => ({
                      ...series,
                      backgroundColor: palette.colors[index] ?? palette.ink,
                      borderColor: palette.colors[index] ?? palette.ink,
                      data: series.data.map((value, month) => equipmentOutput(value, index, month)),
                    })),
                  }}
                  type="bar"
                  height="100%"
                  legend={false}
                  zoomSlider={false}
                />
              </div>
            </section>
          ))}
      </div>
    </>
  );
}
