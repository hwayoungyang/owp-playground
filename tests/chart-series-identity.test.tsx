import '../src/app/i18n';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ChartExample as StackedComboExample } from '../src/playgrounds/charts/examples/stacked-combo';
import type { NativeData } from '../src/playgrounds/charts/model/chartTypes';
import { useCartesian } from '../src/playgrounds/charts/model/useCartesian';

// 데이터 연결만 검증하므로 브라우저 plugin을 등록하는 루트 모듈의 palette hook은 고정합니다.
vi.mock('@owp/charts', () => ({
  useChartPalette: () => ({ colors: ['#0050a0', '#a05000'] }),
}));
vi.mock('../src/playgrounds/charts/runtime/ChartCanvas', () => ({
  ChartCanvas: ({ data }: { readonly data: NativeData }) =>
    createElement('script', { type: 'application/json' }, JSON.stringify(data)),
}));
vi.mock('../src/playgrounds/charts/runtime/Controls', () => ({
  Controls: () => null,
  Toggle: () => null,
}));

const chartDataSchema = z.object({
  datasets: z.array(
    z.object({
      id: z.union([z.string(), z.number()]).optional(),
      data: z.array(z.number()),
    }),
  ),
});

function parseChartData(markup: string) {
  return chartDataSchema.parse(
    JSON.parse(markup.slice(markup.indexOf('>') + 1, markup.lastIndexOf('</script>'))),
  );
}

function renderChartData(series: NonNullable<Parameters<typeof useCartesian>[0]['series']>) {
  function Example() {
    const { data } = useCartesian({
      records: [{ category: 'Jan', actual: 8, plan: 10 }],
      series,
    });
    return createElement('script', { type: 'application/json' }, JSON.stringify(data));
  }
  return parseChartData(renderToString(createElement(Example)));
}

describe('chart example series identity', () => {
  it('keeps every native mixed-chart dataset identifiable after rebuilding the data', () => {
    const data = parseChartData(renderToString(createElement(StackedComboExample, {})));
    expect(data.datasets.map((series) => series.id)).toEqual([
      'line-0',
      'line-1',
      'line-2',
      'target',
    ]);
    expect(data.datasets.map((series) => series.data.length)).toEqual([6, 6, 6, 6]);
  });

  it('passes explicit IDs to the package even when both series read the same field', () => {
    const data = renderChartData([
      { id: 'left', dataKey: 'actual', type: 'bar', datasetOptions: { id: 'ignored' } },
      { id: 'right', dataKey: 'actual', type: 'line' },
    ]);
    expect(data.datasets.map((series) => series.id)).toEqual(['left', 'right']);
    expect(data.datasets.map((series) => series.data)).toEqual([[8], [8]]);
  });

  it('retains legacy dataset IDs and falls back to the field for unassigned series', () => {
    const data = renderChartData([
      { dataKey: 'actual', type: 'bar', datasetOptions: { id: 42 } },
      { dataKey: 'plan', type: 'line' },
    ]);
    expect(data.datasets.map((series) => series.id)).toEqual([42, 'plan']);
  });

  it('keeps identity when labels and series order change', () => {
    const original = renderChartData([
      { id: 'actual-series', dataKey: 'actual', label: '실적', type: 'bar' },
      { id: 'plan-series', dataKey: 'plan', label: '계획', type: 'line' },
    ]);
    const reordered = renderChartData([
      { id: 'plan-series', dataKey: 'plan', label: 'Plan', type: 'line' },
      { id: 'actual-series', dataKey: 'actual', label: 'Actual', type: 'bar' },
    ]);
    expect(original.datasets.map((series) => series.id)).toEqual(['actual-series', 'plan-series']);
    expect(
      reordered.datasets.map((series) => ({
        id: series.id,
        values: series.data,
      })),
    ).toEqual([
      { id: 'plan-series', values: [10] },
      { id: 'actual-series', values: [8] },
    ]);
  });
});
