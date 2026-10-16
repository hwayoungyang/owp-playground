import { alpha } from '@mui/material/styles';
import { ChartFrame } from '@owp/charts';
import { createChartOptions } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useMemo, useState } from 'react';
import type { NativeData, NativeOptions } from '../model/chartTypes';
import { nativeSnapshot } from '../model/nativeSnapshot';
import { createScatterClusters } from '../model/statistics';
import type { ChartExampleProps } from '../model/types';
import { useChartPalette } from '../model/useCartesian';
import { Controls, Range } from '../runtime/Controls';

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const [count, setCount] = useState(2000);
  const clusters = useMemo(() => createScatterClusters(count), [count]);
  const data = useMemo<NativeData>(
    () => ({
      // X slider는 label index를 사용하므로 0–100 좌표의 domain을 제공합니다.
      labels: Array.from({ length: 101 }, (_, value) => value),
      datasets: clusters.map((points, index) => {
        const color = palette.colors[[0, 3, 5, 1][index] ?? 0] ?? palette.ink;
        return {
          label: t('군집 {{number}}', { number: index + 1 }),
          data: points,
          showLine: false,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 0,
          borderColor: color,
          backgroundColor: alpha(color, 0.4),
        };
      }),
    }),
    [clusters, palette, t],
  );
  useEffect(
    () => props.onData?.(nativeSnapshot({ datasets: data.datasets })),
    [data, props.onData],
  );
  const options: NativeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    color: palette.ink,
    font: { family: palette.fontFamily, size: 12 },
    layout: { padding: { top: 16, right: 8 } },
    interaction: { mode: 'nearest', intersect: true, axis: 'xy' },
    scales: Object.fromEntries(
      ['x', 'y'].map((axis) => [
        axis,
        {
          type: 'linear',
          position: axis === 'y' ? 'right' : 'bottom',
          min: 0,
          max: 100,
          ticks: { color: palette.muted, padding: 8 },
          grid: { color: palette.line },
        },
      ]),
    ),
    plugins: createChartOptions({
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ({ dataset, parsed }) =>
              `${dataset.label}: (${parsed.x?.toFixed(2)}, ${parsed.y?.toFixed(2)})`,
          },
        },
      },
    }).plugins,
    onClick: (_event, items) =>
      props.onRecord?.(
        'click',
        items.map((item) => `${item.datasetIndex}:${item.index}`).join(', '),
      ),
  };
  return (
    <>
      <Controls>
        <Range
          label="군집별 점 수"
          value={count}
          min={500}
          max={5000}
          step={500}
          onChange={setCount}
        />
      </Controls>
      <div className="chart-canvas">
        <ChartFrame
          type="line"
          data={data}
          options={options}
          externalTooltip
          height="100%"
          legend={{ position: 'bottom', align: 'center' }}
          interactionLayer={false}
          zoomSlider={{
            x: { min: 0, max: 100, step: 1 },
            y: { min: 0, max: 100, step: 1, position: 'right' },
          }}
        />
      </div>
    </>
  );
}
