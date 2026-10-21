import { getContrastRatio } from '@mui/material/styles';
import { ChartFrame, useChartPalette } from '@owp/charts';
import type { ChartData, ChartOptions, OwpTreemapChartProps, TreemapNode } from '@owp/charts/types';
import { createTreemapData } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useMemo, useState } from 'react';
import { chartMotion } from '../../model/chartMotion';
import type { ChartExampleProps } from '../../model/types';
import { Controls, Toggle } from '../../runtime/Controls';
import { useAvailableChartHeight } from '../../runtime/useAvailableChartHeight';

const output = [
  3900, 1220, 870, 640, 430, 960, 710, 540, 390, 260, 840, 610, 480, 330, 220, 760, 510, 410, 290,
  180,
] as const;
const lines = ['A', 'B', 'C', 'D'] as const;

export function ChartExample(props: ChartExampleProps) {
  const { onData } = props;
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const [labels, setLabels] = useState(true);
  const plot = useAvailableChartHeight();
  const data = useMemo(
    () =>
      output.map((value, index) => ({
        id: `${lines[Math.floor(index / 5)]}-${String((index % 5) + 1).padStart(2, '0')}`,
        label: `${lines[Math.floor(index / 5)]}-${String((index % 5) + 1).padStart(2, '0')}`,
        group: lines[Math.floor(index / 5)],
        value,
        color: palette.colors[Math.floor(index / 5)] ?? palette.ink,
      })),
    [palette.colors, palette.ink],
  );
  useEffect(
    () =>
      onData?.({
        labels: data.map((item) => item.label),
        series: lines.map((line) => ({
          label: t('라인 {{name}}', { name: line }),
          values: data.map((item) => (item.group === line ? item.value : null)),
        })),
      }),
    [data, onData, t],
  );
  const formatter: NonNullable<OwpTreemapChartProps['formatter']> = (item) =>
    labels ? `${item.label}: ${item.value}` : (item.label ?? item.id);
  const nativeData: ChartData<'treemap', TreemapNode[], string> = {
    datasets: lines.map((line) => {
      const nodes = createTreemapData(data.filter((item) => item.group === line));
      return {
        id: `group:${line}`,
        label: line,
        data: nodes,
        gap: 2,
        sort: 'descending',
        labels: true,
        minLabelWidth: 24,
        minLabelHeight: 18,
        formatter,
        backgroundColor: nodes.map((item) => item.raw.color),
        borderColor: palette.surface,
        borderWidth: 1,
        color: nodes.map((item) =>
          getContrastRatio(item.raw.color, '#ffffff') >= 4.5 ? '#ffffff' : '#000000',
        ),
        font: `12px ${palette.fontFamily}`,
      };
    }),
  };
  const options: ChartOptions<'treemap'> = {
    ...chartMotion,
    animation: { ...chartMotion.animation, duration: 160 },
    interaction: { mode: 'nearest', intersect: true, axis: 'xy' },
    layout: { padding: 0 },
    onClick: (_event, items) =>
      props.onRecord?.(
        'click',
        items.map((item) => `${item.datasetIndex}:${item.index}`).join(', '),
      ),
    plugins: {
      tooltip: {
        callbacks: {
          title: (items) => `${t('설비')} ${items[0]?.label ?? ''}`,
          label: (item) =>
            `${t('라인 {{name}}', { name: item.dataset.label })}: ${item.formattedValue}`,
          footer: (items) =>
            t('전체 생산량의 {{value}}%', {
              value: (
                ((items[0]?.parsed.y ?? 0) /
                  output.reduce<number>((sum, amount) => sum + amount, 0)) *
                100
              ).toFixed(1),
            }),
        },
      },
    },
  };
  return (
    <>
      <Controls>
        <Toggle label="값 표시" value={labels} onChange={setLabels} />
      </Controls>
      <div ref={plot} className="chart-canvas chart-native">
        <ChartFrame
          preset="owp"
          type="treemap"
          data={nativeData}
          datasetIdKey="id"
          options={options}
          height="100%"
          showExportButton={false}
          interactionLayer={false}
          xAxisLabelMarker={false}
          aria-label={t('차트 데이터는 데이터 탭에서 확인할 수 있습니다.')}
        />
      </div>
    </>
  );
}
