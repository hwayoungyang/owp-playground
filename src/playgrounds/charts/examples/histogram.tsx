import { ChartFrame } from '@owp/charts';
import {
  createCategoryAxisScale,
  createHistogram,
  createIntegerAxisScale,
} from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useMemo, useState } from 'react';
import {
  createHistogramMeasurements,
  type HistogramDistribution,
  histogramDistributions,
} from '../model/histogramData';
import type { ChartExampleProps } from '../model/types';
import { type ChartOptions, useCartesian, useChartPalette } from '../model/useCartesian';
import { Choice, Controls, Range, Toggle, UpdateButton } from '../runtime/Controls';
import { usePageVisible } from '../runtime/usePageVisible';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [bins, setBins] = useState(18);
  const [count, setCount] = useState(600);
  const [distribution, setDistribution] = useState<HistogramDistribution>('정규 분포');
  const [sequence, setSequence] = useState(0);
  const [running, setRunning] = useState(true);
  const visible = usePageVisible();
  const palette = useChartPalette();
  useEffect(() => {
    if (!running || !visible) return;
    const timer = window.setInterval(() => setSequence((value) => value + 1), 1800);
    return () => window.clearInterval(timer);
  }, [running, visible]);
  const measurements = useMemo(
    () => createHistogramMeasurements({ count, distribution, sequence }),
    [count, distribution, sequence],
  );
  const records = useMemo(
    () =>
      createHistogram(measurements, bins).map((bin) => ({
        category: `${bin.lowerBound.toFixed(1)}–${bin.upperBound.toFixed(1)}`,
        frequency: bin.frequency,
      })),
    [measurements, bins],
  );
  const measurementLabel = t('측정값');
  const frequencyLabel = t('빈도');
  const options = useMemo<ChartOptions>(
    () => ({
      scales: {
        x: createCategoryAxisScale({
          title: { display: true, text: measurementLabel, color: palette.muted },
          grid: { display: false },
        }),
        y: createIntegerAxisScale({
          beginAtZero: true,
          title: { display: true, text: frequencyLabel, color: palette.muted },
        }),
      },
    }),
    [frequencyLabel, measurementLabel, palette.muted],
  );
  const chart = useCartesian(
    {
      records,
      series: [
        {
          dataKey: 'frequency',
          label: frequencyLabel,
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
      options,
    },
    props,
  );
  return (
    <>
      <Controls>
        <Choice
          label="분포"
          value={distribution}
          options={histogramDistributions}
          onChange={setDistribution}
        />
        <Range label="구간 수" value={bins} min={6} max={30} onChange={setBins} />
        <Range
          label="측정값 수"
          value={count}
          min={200}
          max={2000}
          step={10}
          onChange={setCount}
        />
        <Toggle label="자동 갱신" value={running} onChange={setRunning} />
        <UpdateButton onClick={() => setSequence((value) => value + 1)} />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame {...chart} type="bar" height="100%" legend={false} zoomSlider={{ x: true }} />
      </div>
    </>
  );
}
