import { layoutTreemap } from '@owp/charts/utils';
import { describe, expect, it } from 'vitest';
import { monthlyRecords } from '../src/playgrounds/charts/model/data';
import { createProcessSeries } from '../src/playgrounds/charts/model/factoryData';
import { forecastOutput, observedOutput } from '../src/playgrounds/charts/model/forecastData';
import { areaReadings, processReadings } from '../src/playgrounds/charts/model/referenceData';

describe('factory chart fixtures', () => {
  it('keeps line totals, attainment and OEE consistent with monthly output', () => {
    for (const row of monthlyRecords) {
      expect(row.lineA + row.lineB + row.lineC).toBe(row.actual);
      expect(row.rate).toBeCloseTo((row.actual / row.plan) * 100, 1);
      expect(row.oee).toBeCloseTo((row.availability * row.performance * row.quality) / 10_000, 1);
    }
    expect(new Set(monthlyRecords.map((row) => row.plan)).size).toBeGreaterThan(8);
    expect(monthlyRecords.some((row) => row.actual > row.plan)).toBe(true);
    expect(monthlyRecords.some((row) => row.actual < row.plan)).toBe(true);
  });
  it('reproduces process load changes and retains both sides of the target', () => {
    const settings = {
      anchors: [20, 70, 25],
      count: 120,
      volatility: 2,
      seed: 30,
    } as const;
    const series = createProcessSeries(settings);
    expect(series).toEqual(createProcessSeries(settings));
    expect(Math.max(...series)).toBeGreaterThan(65);
    expect(Math.min(...series)).toBeLessThan(25);
    expect(series.every(Number.isFinite)).toBe(true);
    expect(areaReadings.some((row) => row.value < -25)).toBe(true);
    expect(areaReadings.some((row) => row.value > 55)).toBe(true);
    expect(processReadings).toHaveLength(53);
  });
});

describe('treemap proportions', () => {
  it('covers its bounds with non-overlapping areas proportional to positive weights', () => {
    const items = [
      { id: 'A', value: 9 },
      { id: 'B', value: 5 },
      { id: 'C', value: 3 },
      { id: 'D', value: 1 },
    ];
    const box = { x: 10, y: 20, width: 320, height: 180 };
    const tiles = layoutTreemap(items, box);
    expect(tiles).toHaveLength(4);
    for (const tile of tiles) {
      expect(tile.width * tile.height).toBeCloseTo((box.width * box.height * tile.item.value) / 18);
      expect(tile.x).toBeGreaterThanOrEqual(box.x);
      expect(tile.y).toBeGreaterThanOrEqual(box.y);
      expect(tile.x + tile.width).toBeLessThanOrEqual(box.x + box.width + 0.00001);
      expect(tile.y + tile.height).toBeLessThanOrEqual(box.y + box.height + 0.00001);
    }
    for (const [index, a] of tiles.entries())
      for (const b of tiles.slice(index + 1)) {
        const overlap =
          Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
          Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
        expect(overlap).toBeCloseTo(0);
      }
  });
  it('omits non-positive weights and returns no tiles for an empty plot', () => {
    const items = [{ value: 10 }, { value: 0 }, { value: -5 }, { value: Number.NaN }];
    expect(layoutTreemap(items, { x: 0, y: 0, width: 100, height: 80 })).toHaveLength(1);
    expect(layoutTreemap(items, { x: 0, y: 0, width: 0, height: 80 })).toEqual([]);
    expect(layoutTreemap([], { x: 0, y: 0, width: 100, height: 80 })).toEqual([]);
  });
});

describe('factory production forecast', () => {
  it('joins every scenario to observed output and accumulates non-negative daily production', () => {
    const finalActual = observedOutput.at(-1);
    for (const series of forecastOutput) {
      expect(series[0]).toBe(finalActual);
      expect(series.every((value, index) => index === 0 || value >= (series[index - 1] ?? 0))).toBe(
        true,
      );
      expect(observedOutput.length + series.length - 1).toBe(365);
    }
    expect(forecastOutput[1]?.at(-1)).toBeGreaterThan(forecastOutput[0]?.at(-1) ?? 0);
    expect(forecastOutput[0]?.at(-1)).toBeGreaterThan(forecastOutput[2]?.at(-1) ?? 0);
  });
});
