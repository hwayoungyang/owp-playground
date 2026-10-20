import * as materialColors from '@mui/material/colors';
import { getContrastRatio } from '@mui/material/styles';
import { createChartColors } from '@owp/charts/utils';
import { describe, expect, it } from 'vitest';
import { colors } from '../src/shared/theme/tokens';

describe('chart sample colors', () => {
  it.each(['light', 'dark'] as const)('keeps every opaque series visible in %s mode', (mode) => {
    // Given
    const surface = colors[mode].canvas;
    // When
    const series = createChartColors({ mode, surface });
    // Then
    expect(series.length).toBeGreaterThanOrEqual(10);
    expect(new Set(series).size).toBe(series.length);
    for (const color of series) {
      expect(getContrastRatio(color, surface)).toBeGreaterThanOrEqual(3);
      expect(
        Object.values(materialColors).some((family) =>
          Object.values(family).some((value) => value === color),
        ),
      ).toBe(true);
    }
  });

  it('keeps category families in the same order when the mode changes', () => {
    // Given
    const familyOf = (color: string) =>
      Object.entries(materialColors).find(([, family]) =>
        Object.values(family).some((value) => value === color),
      )?.[0];
    // When
    const light = createChartColors({ mode: 'light', surface: colors.light.canvas }).map(familyOf);
    const dark = createChartColors({ mode: 'dark', surface: colors.dark.canvas }).map(familyOf);
    // Then
    expect(light.every(Boolean)).toBe(true);
    expect(dark).toEqual(light);
  });

  it('selects darker MUI shades when the light surface needs more contrast', () => {
    // Given
    const surface = materialColors.grey[200];
    const original = createChartColors({ mode: 'light', surface: colors.light.canvas });
    // When
    const adjusted = createChartColors({ mode: 'light', surface });
    // Then
    expect(adjusted).not.toEqual(original);
    for (const color of adjusted)
      expect(getContrastRatio(color, surface)).toBeGreaterThanOrEqual(3);
  });
});
