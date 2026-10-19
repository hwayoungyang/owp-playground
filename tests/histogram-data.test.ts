import { describe, expect, it } from 'vitest';
import { createHistogram } from '../src/playgrounds/charts/model/data';
import { createHistogramMeasurements } from '../src/playgrounds/charts/model/histogramData';

describe('histogram sample distributions', () => {
  it('spreads normal readings across bins without one isolated spike consuming the domain', () => {
    // Given
    const measurements = createHistogramMeasurements({
      count: 600,
      distribution: '정규 분포',
      sequence: 0,
    });
    // When
    const bins = createHistogram(measurements, 18);
    // Then
    expect(bins.filter((bin) => Number(bin.frequency) > 0).length).toBeGreaterThanOrEqual(14);
    expect(bins.reduce((sum, bin) => sum + Number(bin.frequency), 0)).toBe(600);
    expect(Math.max(...bins.map((bin) => Number(bin.frequency)))).toBeLessThan(150);
  });

  it('separates the two peaks of a bimodal sample', () => {
    // Given
    const readings = createHistogramMeasurements({
      count: 2000,
      distribution: '이중 봉우리',
      sequence: 0,
    });
    // When
    const middle = readings.filter((value) => value >= 47 && value <= 53).length;
    const peaks = readings.filter(
      (value) => (value >= 39 && value <= 45) || (value >= 55 && value <= 61),
    ).length;
    // Then
    expect(middle).toBeLessThan(peaks / 10);
  });

  it('changes the readings on refresh while keeping the same sequence reproducible', () => {
    // Given
    const settings = { count: 600, distribution: '오른쪽 치우침', sequence: 3 } as const;
    const original = createHistogramMeasurements(settings);
    // When
    const refreshed = createHistogramMeasurements({ ...settings, sequence: 4 });
    // Then
    expect(refreshed).not.toEqual(original);
    expect(createHistogramMeasurements(settings)).toEqual(original);
    expect(refreshed.every(Number.isFinite)).toBe(true);
  });
});
