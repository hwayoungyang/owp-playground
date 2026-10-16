import { createRadarChartData, wrapRadarLabel } from '@owp/charts/utils';
import { describe, expect, it } from 'vitest';

describe('package radar data contract', () => {
  it('retains arbitrary indicator counts and values outside the old 0–100 sample scale', () => {
    const data = createRadarChartData(
      ['A', 'B', 'C', 'D'],
      [{ id: 'range', label: 'Range', values: [-10, 0, null, 150] }],
    );
    expect(data.labels).toHaveLength(4);
    expect(data.datasets[0]?.data).toEqual([-10, 0, null, 150]);
  });
  it('wraps at word boundaries and preserves explicit lines', () => {
    expect(wrapRadarLabel('에너지 효율', 18)).toEqual(['에너지 효율']);
    expect(wrapRadarLabel('Operational stability', 12)).toEqual(['Operational', 'stability']);
    expect(wrapRadarLabel('On-time delivery', 8).join(' ')).toBe('On-time delivery');
    expect(wrapRadarLabel('A\nB', 18)).toEqual(['A', 'B']);
  });
});
