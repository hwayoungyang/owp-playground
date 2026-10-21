import { alpha } from '@mui/material/styles';
import { ChartFrame } from '@owp/charts';
import type { ChartData, ChartOptions, HeatmapPoint } from '@owp/charts/types';
import { createHeatmapData, getHeatmapColor } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useMemo, useState } from 'react';
import { chartMotion } from '../../model/chartMotion';
import { factoryNoise } from '../../model/factoryData';
import type { ChartExampleProps } from '../../model/types';
import { useChartPalette } from '../../model/useCartesian';
import { Controls, Toggle } from '../../runtime/Controls';
import { useAvailableChartHeight } from '../../runtime/useAvailableChartHeight';

const shiftLoad = [42, 72, 87, 93, 71, 38, 68, 84, 95, 87, 65, 32] as const;
const production = shiftLoad.map((load, hour) =>
  Array.from({ length: 7 }, (_, day) =>
    Math.round(Math.max(5, load * (day > 4 ? 0.48 : 1) + factoryNoise(hour * 7 + day, 91) * 9)),
  ),
);

export function ChartExample(props: ChartExampleProps) {
  const { onData } = props;
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const [values, setValues] = useState(false);
  const plot = useAvailableChartHeight();
  const color = palette.colors[0] ?? palette.ink;
  const intensity = [0.12, 0.3, 0.5, 0.7, 0.9].map((opacity) => alpha(color, opacity));
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
  useEffect(() => onData?.(snapshot), [onData, snapshot]);
  const heatmap = createHeatmapData(data, {
    x: snapshot.labels,
    y: snapshot.series.map((series) => series.label),
    domain: [0, maximum],
  });
  const nativeData: ChartData<'heatmap', HeatmapPoint[], string> = {
    datasets: [
      {
        id: 'heatmap',
        label: '',
        data: heatmap.points,
        xKeys: heatmap.x,
        yKeys: heatmap.y,
        backgroundColor: heatmap.points.map((point) =>
          getHeatmapColor(point.value, { domain: heatmap.domain, colors: intensity }),
        ),
        borderColor: palette.surface,
        borderWidth: 0,
        color: palette.ink,
        font: `12px ${palette.fontFamily}`,
        gap: 1,
        valueLabels: values,
      },
    ],
  };
  const options: ChartOptions<'heatmap'> = {
    ...chartMotion,
    animation: { ...chartMotion.animation, duration: 160 },
    interaction: { mode: 'nearest', intersect: true, axis: 'xy' },
    onClick: (_event, items) =>
      props.onRecord?.(
        'click',
        items.map((item) => `${item.datasetIndex}:${item.index}`).join(', '),
      ),
    scales: {
      x: {
        type: 'category',
        offset: true,
        labels: heatmap.x.map(String),
        grid: { display: false },
      },
      y: {
        type: 'category',
        offset: true,
        reverse: false,
        labels: heatmap.y.map(String),
        grid: { display: false },
        ticks: { maxTicksLimit: 6 },
      },
    },
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
        <ChartFrame
          preset="owp"
          type="heatmap"
          data={nativeData}
          datasetIdKey="id"
          options={options}
          legend={false}
          height="100%"
          showExportButton={false}
          interactionLayer={false}
          xAxisLabelMarker={false}
          aria-label={t('차트 데이터는 데이터 탭에서 확인할 수 있습니다.')}
        />
      </div>
      <div className="chart-heat-key">
        <span>{t('적음')}</span>
        <span className="chart-heat-ramp" aria-hidden="true">
          {intensity.map((backgroundColor) => (
            <span key={backgroundColor} style={{ flex: 1, backgroundColor }} />
          ))}
        </span>
        <span>{t('많음')}</span>
        <span>0–{maximum}</span>
      </div>
    </>
  );
}
