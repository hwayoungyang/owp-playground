import { useChartPalette } from '@owp/charts';

export { useChartPalette } from '@owp/charts';

import type { ChartSeriesConfig, CoreChartProps } from '@owp/charts/types';
import { createChartColorMap, createChartData } from '@owp/charts/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useMemo } from 'react';
import { chartMotion } from './chartMotion';
import { monthlyRecords } from './data';
import type { ChartExampleProps, ChartRecord } from './types';

export type ChartOptions = NonNullable<CoreChartProps['options']>;
export type Series = ChartSeriesConfig<ChartRecord>;
export function useMonthlyRecords() {
  const { t } = useOwpTranslation();
  return useMemo(
    () =>
      monthlyRecords.map((row) => ({
        ...row,
        category: t('{{month}}월', { month: row.category }),
      })),
    [t],
  );
}
export function useCartesian(
  config: {
    readonly records?: readonly ChartRecord[];
    readonly series?: readonly Series[];
    readonly options?: ChartOptions;
  },
  props: ChartExampleProps = {},
) {
  const palette = useChartPalette();
  const records = useMonthlyRecords();
  const { t } = useOwpTranslation();
  const source = config.records ?? records;
  const data = useMemo(() => {
    const seriesList = config.series ?? [
      { dataKey: 'actual', label: t('실적'), type: 'bar' as const },
    ];
    const colors = createChartColorMap(
      seriesList.map((series) => series.dataKey),
      Object.fromEntries(
        seriesList.map((series, index) => [
          series.dataKey,
          palette.colors[index % palette.colors.length],
        ]),
      ),
    );
    const chartData = createChartData({
      categoryKey: 'category',
      data: source,
      series: seriesList.map((series) => ({
        backgroundColor: colors[series.dataKey],
        borderColor: colors[series.dataKey],
        ...series,
        datasetOptions: {
          borderWidth: series.type === 'line' ? 2 : 0,
          pointRadius: 3,
          tension: 0.25,
          borderRadius: 4,
          maxBarThickness: 36,
          ...series.datasetOptions,
        },
      })),
    });
    return {
      ...chartData,
      datasets: chartData.datasets.map((dataset, index) => ({
        ...dataset,
        id: String(seriesList[index]?.dataKey ?? index),
      })),
    };
  }, [source, config.series, palette.colors, t]);
  const input = config.options ?? {};
  const options: ChartOptions = {
    ...chartMotion,
    ...input,
    onClick(event, elements, chart) {
      props.onRecord?.(
        'click',
        elements.map((item) => `${item.datasetIndex}:${item.index}`).join(', '),
      );
      input.onClick?.call(this, event, elements, chart);
    },
  };
  useEffect(() => {
    props.onData?.({
      labels: (data.labels ?? []).map(String),
      series: data.datasets.map((series) => ({
        label: series.label ?? '',
        values: [...series.data],
      })),
    });
  }, [data, props.onData]);
  return {
    preset: 'owp' as const,
    datasetIdKey: 'id',
    data,
    options,
    externalTooltip: true,
    legend: { position: 'bottom', align: 'center' } as const,
    'aria-label': t('시각화 차트. 데이터 탭에서 각 값을 확인할 수 있습니다.'),
  };
}
