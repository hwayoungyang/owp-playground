import { createPareto, summarizeBox } from '@owp/charts/utils';
import { describe, expect, it } from 'vitest';
import { createScatterClusters } from '../src/playgrounds/charts/model/statistics';

describe('statistical chart data', () => {
  it('uses interpolated quartiles and observed whiskers while retaining outliers', () => {
    const values = [100, 8, 6, 4, 2, 0, Number.NaN];
    expect(summarizeBox(values)).toEqual({
      min: 0,
      q1: 2.5,
      median: 5,
      q3: 7.5,
      max: 100,
      low: 0,
      high: 8,
      outliers: [100],
    });
    expect(values[0]).toBe(100);
    expect(summarizeBox([5, 5, 5])?.outliers).toEqual([]);
    expect(summarizeBox([5])?.median).toBe(5);
    expect(summarizeBox([Number.NaN])).toBeNull();
  });
  it('sorts Pareto counts without mutating the source and reaches 100%', () => {
    const rows = [
      { label: 'B', count: 2 },
      { label: 'A', count: 6 },
      { label: 'C', count: 2 },
    ];
    expect(
      createPareto(rows, (row) => row.count).map((row) => ({
        ...row.item,
        cumulative: row.cumulativeRatio * 100,
      })),
    ).toEqual([
      { label: 'A', count: 6, cumulative: 60 },
      { label: 'B', count: 2, cumulative: 80 },
      { label: 'C', count: 2, cumulative: 100 },
    ]);
    expect(rows[0]?.label).toBe('B');
    expect(createPareto([{ label: 'A', count: 0 }], (row) => row.count)[0]?.cumulativeRatio).toBe(
      0,
    );
    expect(createPareto([], () => 0)).toEqual([]);
  });
  it('creates four deterministic dense clusters around distinct centers', () => {
    const clusters = createScatterClusters(2000);
    expect(clusters).toEqual(createScatterClusters(2000));
    const centers = [
      [27, 70],
      [73, 72],
      [36, 28],
      [79, 30],
    ];
    for (const [index, points] of clusters.entries()) {
      expect(points).toHaveLength(2000);
      const x = points.reduce((sum, point) => sum + point.x, 0) / points.length;
      const y = points.reduce((sum, point) => sum + point.y, 0) / points.length;
      expect(Math.abs(x - (centers[index]?.[0] ?? 0))).toBeLessThan(1);
      expect(Math.abs(y - (centers[index]?.[1] ?? 0))).toBeLessThan(1);
      expect(points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(
        true,
      );
    }
  });
});
