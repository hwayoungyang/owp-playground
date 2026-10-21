import { describe, expect, it } from 'vitest';
import { chartCatalog, findChartEntry } from '../src/playgrounds/charts/catalog';
import { chartjsCoverage } from '../src/playgrounds/charts/model/chartjsCoverage';
import { nativeSnapshot } from '../src/playgrounds/charts/model/nativeSnapshot';

describe('Chart.js sample coverage', () => {
  it('accounts for every official executable sample without broken or silent fallback routes', () => {
    expect(chartjsCoverage).toHaveLength(75);
    expect(new Set(chartjsCoverage.map((example) => example.path)).size).toBe(75);
    expect(chartjsCoverage.filter((example) => example.status === 'unavailable')).toHaveLength(5);
    for (const [path, id] of [
      ['scales/log', 'log-scale'],
      ['scales/time-combo', 'time-combo'],
      ['scales/time-line', 'time-line'],
      ['scales/time-max-span', 'time-max-span'],
      ['subtitle/basic', 'chart-title'],
    ])
      expect(chartjsCoverage.find((example) => example.path === path)).toMatchObject({
        status: 'added',
        exampleId: id,
      });
    expect(chartCatalog.filter((entry) => entry.kind === 'chart')).toHaveLength(70);
    const added = chartjsCoverage.filter((example) => example.status === 'added');
    expect(added).toHaveLength(40);
    expect(chartjsCoverage.filter((example) => example.status === 'excluded')).toHaveLength(8);
    for (const example of chartjsCoverage) {
      if ('exampleId' in example) {
        expect(findChartEntry(example.exampleId).id).toBe(example.exampleId);
        expect(
          chartCatalog.some((entry) => entry.id === example.exampleId && entry.kind === 'chart'),
        ).toBe(true);
      } else expect(example.note.length).toBeGreaterThan(10);
    }
  });
});

describe('accessible native chart data', () => {
  it('preserves floating interval edges and gaps rather than reporting a misleading sum', () => {
    expect(
      nativeSnapshot({
        labels: ['one', 'two', 'three'],
        datasets: [{ label: 'interval', data: [[10, 20], null, [-5, 3]] }],
      }),
    ).toEqual({
      labels: ['one', 'two', 'three'],
      series: [
        { label: 'interval [0]', values: [10, null, -5] },
        { label: 'interval [1]', values: [20, null, 3] },
      ],
    });
  });
  it('keeps numeric X coordinates and the bubble radius available in the JSON data', () => {
    expect(
      nativeSnapshot({
        datasets: [
          {
            label: 'bubble',
            data: [
              { x: 10, y: 20, r: 4 },
              { x: 30, y: 40, r: 8 },
            ],
          },
        ],
      }),
    ).toEqual({
      labels: ['10', '30'],
      series: [
        { label: 'bubble', values: [20, 40] },
        { label: 'bubble (r)', values: [4, 8] },
      ],
    });
  });
  it('aligns independent XY series by X and derives coordinates for empty labels', () => {
    expect(
      nativeSnapshot({
        labels: [],
        datasets: [
          {
            label: 'A',
            data: [
              { x: 20, y: 5 },
              { x: 10, y: 3 },
            ],
          },
          {
            label: 'B',
            data: [
              { x: 30, y: 8 },
              { x: 10, y: 4 },
            ],
          },
        ],
      }),
    ).toEqual({
      labels: ['10', '20', '30'],
      series: [
        { label: 'A', values: [3, 5, null] },
        { label: 'B', values: [4, null, 8] },
      ],
    });
  });
  it('preserves explicit time labels for live XY data', () => {
    expect(
      nativeSnapshot({
        labels: ['12:00:01', '12:00:02'],
        datasets: [
          {
            data: [
              { x: 61, y: 20 },
              { x: 62, y: 25 },
            ],
          },
        ],
      }).labels,
    ).toEqual(['12:00:01', '12:00:02']);
  });
  it('retains zeroes and nulls for ordinary numeric series', () => {
    expect(
      nativeSnapshot({
        labels: ['A', 'B'],
        datasets: [{ label: 'value', data: [0, null] }],
      }).series[0]?.values,
    ).toEqual([0, null]);
  });
});
