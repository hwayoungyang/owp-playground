import { alpha } from '@mui/material/styles';
import { createGroupedAxisLabelsPlugin } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useMemo, useState } from 'react';
import type { NativeChartType, NativeData, NativeOptions } from '../model/chartTypes';
import type { ChartExampleProps } from '../model/types';
import { useChartPalette } from '../model/useCartesian';
import { ChartCanvas } from '../runtime/ChartCanvas';
import { Controls, Toggle } from '../runtime/Controls';

const outputs = [
  [
    [20, 15, 12, 9],
    [12, 8, 16, 12],
  ],
  [
    [15, 20, 14, 19],
    [16, 6, 11, 12],
  ],
  [
    [5, 7, 15, 13],
    [10, 12, 10, 14],
  ],
] as const;

export function ChartExample(props: ChartExampleProps) {
  const { onData } = props;
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const [values, setValues] = useState(false);
  const names = ['라인 A', '라인 B', '라인 C'].map((name) => t(name));
  const slots = Array.from({ length: 14 }, (_, index) =>
    index % 5 === 4 ? '' : String(2022 + (index % 5)),
  );
  const data: NativeData = {
    labels: slots,
    datasets: outputs.flatMap((shifts, line) =>
      shifts.map((points, shift) => ({
        label: `${names[line]} · ${t(shift === 0 ? '주간조' : '야간조')}`,
        data: slots.map((year, index) =>
          year && Math.floor(index / 5) === line ? (points[index % 5] ?? null) : null,
        ),
        backgroundColor:
          shift === 0 ? palette.colors[line] : alpha(palette.colors[line] ?? palette.ink, 0.4),
        stack: 'output',
        borderRadius: 0,
        categoryPercentage: 0.85,
        barPercentage: 0.9,
      })),
    ),
  };
  const labels = createGroupedAxisLabelsPlugin<NativeChartType>({
    groups: names.map((name, line) => ({
      id: String(line),
      label: name,
      start: line * 5,
      end: line * 5 + 3,
    })),
    color: palette.ink,
    font: `600 12px ${palette.fontFamily ?? 'sans-serif'}`,
  });
  const options: NativeOptions = {
    layout: { padding: { top: 16, right: 8, bottom: 28 } },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          autoSkip: false,
          callback(value) {
            const year = this.getLabelForValue(Number(value));
            return this.width < 500 ? year.slice(-2) : year;
          },
        },
      },
      y: {
        stacked: true,
        min: 0,
        suggestedMax: 40,
        title: { display: true, text: t('생산량 (천 개)') },
      },
    },
    plugins: {
      datalabels: {
        display: values,
        color: (context) =>
          context.datasetIndex % 2 === 0
            ? palette.contrastText(
                palette.colors[Math.floor(context.datasetIndex / 2)] ?? palette.surface,
              )
            : palette.ink,
        formatter: (value: number | null) => value ?? '',
      },
      tooltip: {
        filter: (item) => item.raw !== null,
        callbacks: {
          title: (items) =>
            `${names[Math.floor((items[0]?.dataIndex ?? 0) / 5)]} · ${items[0]?.label}`,
        },
      },
    },
  };
  const snapshot = useMemo(
    () => ({
      labels: ['라인 A', '라인 B', '라인 C'].flatMap((name) =>
        Array.from({ length: 4 }, (_, year) => `${t(name)} · ${2022 + year}`),
      ),
      series: outputs.flatMap((shifts, line) =>
        shifts.map((points, shift) => ({
          label: `${t(['라인 A', '라인 B', '라인 C'][line] ?? '')} · ${t(shift === 0 ? '주간조' : '야간조')}`,
          values: Array.from({ length: 12 }, (_, index) =>
            Math.floor(index / 4) === line ? (points[index % 4] ?? null) : null,
          ),
        })),
      ),
    }),
    [t],
  );
  useEffect(() => onData?.(snapshot), [snapshot, onData]);
  return (
    <>
      <Controls>
        <Toggle label="값 표시" value={values} onChange={setValues} />
      </Controls>
      <ChartCanvas
        type="bar"
        data={data}
        options={options}
        plugins={[labels]}
        onRecord={props.onRecord}
      />
    </>
  );
}
