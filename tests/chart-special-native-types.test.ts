import type {
  BoxPlotData,
  BoxPlotDatasetOptions,
  BoxPlotDatum,
  BoxPlotStatistics,
  ChartData,
  ChartOptions,
  CoreChartProps,
  HeatmapDatasetOptions,
  HeatmapPoint,
  OwpBoxPlotChartProps,
  OwpHeatmapChartProps,
  OwpTreemapChartProps,
  TreemapDatasetOptions,
  TreemapNode,
} from '@owp/charts/types';
import {
  createBoxPlotTooltipCallbacks,
  createHeatmapData,
  createTreemapData,
} from '@owp/charts/utils';
import { describe, expect, expectTypeOf, it } from 'vitest';

type SpecialChartType = 'boxPlot' | 'treemap' | 'heatmap';
type ChartDataset<TType extends SpecialChartType> = ChartData<TType>['datasets'][number];
type TooltipCallbacks<TType extends SpecialChartType> =
  ChartOptions<TType> extends {
    readonly plugins?: { readonly tooltip?: { readonly callbacks?: infer TCallbacks } };
  }
    ? NonNullable<TCallbacks>
    : never;
type TooltipItem<TType extends SpecialChartType> =
  TooltipCallbacks<TType> extends {
    readonly label?: (item: infer TItem) => unknown;
  }
    ? TItem
    : never;

describe('special native chart contracts', () => {
  it('uses native defaults for dataset options and wrapper refs', () => {
    // Given / When: 설치본의 공개 declaration을 native 계약과 비교합니다.
    expectTypeOf<BoxPlotDatasetOptions>().toEqualTypeOf<BoxPlotDatasetOptions<'boxPlot'>>();
    expectTypeOf<TreemapDatasetOptions>().toEqualTypeOf<TreemapDatasetOptions<'treemap'>>();
    expectTypeOf<HeatmapDatasetOptions>().toEqualTypeOf<HeatmapDatasetOptions<'heatmap'>>();

    // Then
    expectTypeOf<OwpBoxPlotChartProps['chartRef']>().toEqualTypeOf<
      CoreChartProps<'boxPlot', BoxPlotDatum[], string>['chartRef']
    >();
    expectTypeOf<OwpTreemapChartProps['chartRef']>().toEqualTypeOf<
      CoreChartProps<'treemap', TreemapNode[], string>['chartRef']
    >();
    expectTypeOf<OwpHeatmapChartProps['chartRef']>().toEqualTypeOf<
      CoreChartProps<'heatmap', HeatmapPoint[], string>['chartRef']
    >();
    expectTypeOf<
      Extract<CoreChartProps['type'], 'owpBoxPlot' | 'owpTreemap' | 'owpHeatmap'>
    >().toEqualTypeOf<never>();
  });

  it('accepts boxPlot data, scriptable dataset options and non-generic tooltip callbacks together', () => {
    // Given
    const dataset: ChartDataset<'boxPlot'> = {
      id: 'measurements',
      data: [{ id: 'line-a', kind: 'observations', values: [1, 2, 3, 4, 20] }],
      borderColor: (context) => {
        expectTypeOf(context.dataset.data).toEqualTypeOf<BoxPlotDatum[]>();
        return context.dataIndex === 0 ? '#000000' : '#ffffff';
      },
    };
    const callbacks = createBoxPlotTooltipCallbacks({
      min: 'Min',
      q1: 'Q1',
      median: 'Median',
      q3: 'Q3',
      max: 'Max',
      whiskers: 'Whiskers',
      outliers: 'Outliers',
    });

    // When
    const data: ChartData<'boxPlot', BoxPlotDatum[], string> = { datasets: [dataset] };
    const options: ChartOptions<'boxPlot'> = {
      datasets: { boxPlot: { whiskers: 'iqr', showOutliers: true } },
      plugins: { tooltip: { callbacks } },
    };

    // Then
    expect(data.datasets[0]?.data[0]).toEqual({
      id: 'line-a',
      kind: 'observations',
      values: [1, 2, 3, 4, 20],
    });
    expect(options.datasets?.boxPlot?.showOutliers).toBe(true);
    expectTypeOf<
      TooltipItem<'boxPlot'>['parsed']['statistics']
    >().toEqualTypeOf<BoxPlotStatistics | null>();
    expectTypeOf<BoxPlotData>().toExtend<ChartData<'boxPlot', BoxPlotDatum[], string>>();
    expectTypeOf(callbacks).toExtend<TooltipCallbacks<'boxPlot'>>();
  });

  it('preserves treemap source records in native datasets and tooltip options', () => {
    // Given
    const records = [{ id: 'a', group: 'A', value: 30, color: '#000000' }];
    const dataset: ChartDataset<'treemap'> = {
      id: 'group:A',
      data: createTreemapData(records),
      borderColor: (context) => {
        expectTypeOf(context.dataset.data).toEqualTypeOf<TreemapNode[]>();
        return '#ffffff';
      },
    };

    // When
    const data: ChartData<'treemap', TreemapNode[], string> = { datasets: [dataset] };
    const options: ChartOptions<'treemap'> = {
      datasets: { treemap: { gap: 2, sort: 'descending', labels: true } },
      plugins: { tooltip: { callbacks: { label: (item) => String(item.parsed.y) } } },
    };

    // Then
    expect(data.datasets[0]?.data[0]?.raw).toBe(records[0]);
    expect(options.datasets?.treemap?.gap).toBe(2);
    expectTypeOf<TooltipItem<'treemap'>['parsed']>().toEqualTypeOf<{ x: number; y: number }>();
  });

  it('preserves heatmap nulls and category order in native datasets and tooltip options', () => {
    // Given
    const points: HeatmapPoint[] = [
      { x: 'Tue', y: '08:00', value: null },
      { x: 'Mon', y: '08:00', value: 0 },
    ];
    const heatmap = createHeatmapData(points, { x: ['Mon', 'Tue'], y: ['08:00'], missing: 'cell' });
    const dataset: ChartDataset<'heatmap'> = {
      id: 'heatmap',
      data: heatmap.points,
      xKeys: heatmap.x,
      yKeys: heatmap.y,
      backgroundColor: (context) => {
        expectTypeOf(context.dataset.data).toEqualTypeOf<HeatmapPoint[]>();
        return '#000000';
      },
    };

    // When
    const data: ChartData<'heatmap', HeatmapPoint[], string> = { datasets: [dataset] };
    const options: ChartOptions<'heatmap'> = {
      datasets: { heatmap: { gap: 1, valueLabels: true } },
      plugins: { tooltip: { callbacks: { label: (item) => String(item.parsed.value) } } },
    };

    // Then
    expect(data.datasets[0]?.xKeys).toEqual(['Mon', 'Tue']);
    expect(data.datasets[0]?.data.map((point) => point.value)).toEqual([0, null]);
    expect(options.datasets?.heatmap?.valueLabels).toBe(true);
    expectTypeOf<TooltipItem<'heatmap'>['parsed']['value']>().toEqualTypeOf<number | null>();
  });
});
