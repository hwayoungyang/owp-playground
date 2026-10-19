import { darken } from '@mui/material/styles';
import { ChartFrame } from '@owp/charts';
import { useOwpTranslation } from '@owp/components/hooks';
import { useState } from 'react';
import type { ChartExampleProps } from '../model/types';
import { useCartesian, useChartPalette, useMonthlyRecords } from '../model/useCartesian';
import { Choice, Controls, Range, Toggle } from '../runtime/Controls';

const labelPositions = {
  바깥쪽: { anchor: 'end', align: 'end' },
  '안쪽 끝': { anchor: 'end', align: 'start' },
  '안쪽 중앙': { anchor: 'center', align: 'center' },
} as const;

export function ChartExample(props: ChartExampleProps) {
  const { t } = useOwpTranslation();
  const [count, setCount] = useState(12);
  const allRecords = useMonthlyRecords();
  const palette = useChartPalette();
  const barColor = darken(palette.colors[0] ?? palette.ink, 0.35);
  const [position, setPosition] = useState<keyof typeof labelPositions>('안쪽 중앙');
  const [horizontal, setHorizontal] = useState(false);
  const [vertical, setVertical] = useState(true);
  const inside = position !== '바깥쪽';
  const records = allRecords.slice(0, count);
  const chart = useCartesian(
    {
      records,
      series: [
        {
          dataKey: 'actual',
          label: t('실적'),
          type: 'bar',
          backgroundColor: barColor,
          borderColor: barColor,
        },
      ],
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
          datalabels: {
            display: (context) => {
              if (!inside) return true;
              const bar = context.chart.getDatasetMeta(context.datasetIndex).data[
                context.dataIndex
              ];
              const bounds = bar?.getProps(['width', 'height'], true);
              if (typeof bounds?.width !== 'number' || typeof bounds.height !== 'number') {
                return false;
              }
              const { ctx } = context.chart;
              ctx.save();
              ctx.font = `600 12px ${palette.fontFamily}`;
              const textWidth = ctx.measureText(
                String(context.dataset.data[context.dataIndex]),
              ).width;
              ctx.restore();
              return vertical
                ? textWidth + 8 <= bounds.height && 12 <= bounds.width
                : textWidth + 8 <= bounds.width && 12 <= bounds.height;
            },
            color: inside ? palette.contrastText(barColor) : palette.ink,
            ...labelPositions[position],
            rotation: vertical ? -90 : 0,
            font: { size: 12, weight: 600 },
            formatter: (value: number) => String(value),
          },
        },
        layout: {
          padding: {
            top: inside || horizontal ? 16 : 40,
            right: inside || !horizontal ? 8 : 40,
          },
        },
      },
    },
    props,
  );
  return (
    <>
      <Controls>
        <Range label="표시할 월 수" value={count} min={3} max={12} onChange={setCount} />
        <Choice
          label="라벨 위치"
          value={position}
          options={['바깥쪽', '안쪽 끝', '안쪽 중앙']}
          onChange={setPosition}
        />
        <Toggle
          label="가로 막대"
          value={horizontal}
          onChange={(value) => {
            setHorizontal(value);
            setVertical(!value);
          }}
        />
        <Toggle label="라벨 세로 표시" value={vertical} onChange={setVertical} />
      </Controls>
      {inside && <p className="chart-note">{t('안쪽 라벨은 막대 안에 들어갈 때만 표시합니다.')}</p>}
      <div className="chart-canvas">
        <ChartFrame type="bar" {...chart} height="100%" />
      </div>
    </>
  );
}
