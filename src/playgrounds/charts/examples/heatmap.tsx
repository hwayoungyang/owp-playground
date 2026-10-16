import { alpha } from '@mui/material/styles';
import { OwpHeatmapChart } from '@owp/charts';
import type { HeatmapPoint, OwpHeatmapChartProps } from '@owp/charts/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useMemo, useState } from 'react';
import { chartMotion } from '../model/chartMotion';
import { factoryNoise } from '../model/factoryData';
import type { ChartExampleProps } from '../model/types';
import { useChartPalette } from '../model/useCartesian';
import { Controls, Toggle } from '../runtime/Controls';
import { useAvailableChartHeight } from '../runtime/useAvailableChartHeight';

const shiftLoad = [42, 72, 87, 93, 71, 38, 68, 84, 95, 87, 65, 32] as const;
const production = shiftLoad.map((load, hour) =>
  Array.from({ length: 7 }, (_, day) =>
    Math.round(Math.max(5, load * (day > 4 ? 0.48 : 1) + factoryNoise(hour * 7 + day, 91) * 9)),
  ),
);

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const [values, setValues] = useState(false);
  const plot = useAvailableChartHeight();
  const color = palette.colors[0] ?? palette.ink;
  const maximum = Math.max(...production.flat());
  const snapshot = useMemo(
    () => ({
      labels: ['월', '화', '수', '목', '금', '토', '일'].map((day) => t(day)),
      series: production.map((counts, hour) => ({
        label: `${hour + 8}:00`,
        values: counts,
      })),
    }),
    [t],
  );
  const data = useMemo<HeatmapPoint[]>(() => {
    const points: HeatmapPoint[] = [];
    for (const series of snapshot.series)
      for (let day = 0; day < series.values.length; day++) {
        points.push({
          x: snapshot.labels[day] ?? '',
          y: series.label,
          value: series.values[day] ?? null,
        });
      }
    return points;
  }, [snapshot]);
  useEffect(() => props.onData?.(snapshot), [props.onData, snapshot]);
  const options: OwpHeatmapChartProps['options'] = {
    ...chartMotion,
    onClick: (_event, items) =>
      props.onRecord?.(
        'click',
        items.map((item) => `${item.datasetIndex}:${item.index}`).join(', '),
      ),
    scales: { y: { ticks: { maxTicksLimit: 6 } } },
    plugins: {
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label ?? '',
          label: (item) => t('생산량: {{value}}개', { value: item.parsed.value ?? 0 }),
        },
      },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="값 표시" value={values} onChange={setValues} />
      </Controls>
      <div ref={plot} className="chart-canvas chart-native">
        <OwpHeatmapChart
          data={data}
          x={snapshot.labels}
          y={snapshot.series.map((series) => series.label)}
          domain={[0, maximum]}
          valueLabels={values}
          legend={false}
          options={options}
          height="100%"
          showExportButton={false}
          aria-label={t('시각화 차트. 데이터 탭에서 각 값을 확인할 수 있습니다.')}
        />
      </div>
      <div className="chart-heat-key">
        <span>{t('적음')}</span>
        <span className="chart-heat-ramp" aria-hidden="true">
          {[0.12, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
            <span key={opacity} style={{ flex: 1, backgroundColor: alpha(color, opacity) }} />
          ))}
        </span>
        <span>{t('많음')}</span>
        <span>0–{maximum}</span>
      </div>
    </>
  );
}
