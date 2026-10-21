import { describe, expect, expectTypeOf, it } from 'vitest';
import type { NativeChartType, NativeData } from '../src/playgrounds/charts/model/chartTypes';
import { nativeSnapshot } from '../src/playgrounds/charts/model/nativeSnapshot';

describe('native chart point contracts', () => {
  it('accepts native scatter and bubble controllers', () => {
    expectTypeOf<NativeChartType>()
      .extract<'scatter' | 'bubble'>()
      .toEqualTypeOf<'scatter' | 'bubble'>();
  });

  it('preserves time labels, explicit missing measurements and bubble radii together', () => {
    const data: NativeData = {
      labels: ['2026-10-01T00:00:00.000Z', '2026-10-02T00:00:00.000Z'],
      datasets: [
        {
          label: 'A',
          data: [
            { x: 100, y: null, r: 4 },
            { x: 200, y: 0, r: 8 },
          ],
        },
        {
          label: 'B',
          data: [
            { x: 200, y: 7 },
            { x: 300, y: null },
          ],
        },
      ],
    };
    expect(nativeSnapshot(data)).toEqual({
      labels: ['2026-10-01T00:00:00.000Z', '2026-10-02T00:00:00.000Z', '300'],
      series: [
        { label: 'A', values: [null, 0, null] },
        { label: 'A (r)', values: [4, 8, null] },
        { label: 'B', values: [null, 7, null] },
      ],
    });
  });
});
