import { blue, orange, purple, teal } from '@mui/material/colors';
import { getContrastRatio } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';
import {
  getBarSegmentLabelColor,
  getBarSegmentLabelRotation,
} from '../src/playgrounds/charts/model/barSegmentLabels';

describe('bar segment label fitting', () => {
  it.each([
    { width: 56, height: 40, textWidth: 32, expected: 0 },
    { width: 18, height: 70, textWidth: 38, expected: -90 },
    { width: 10, height: 70, textWidth: 38, expected: null },
    { width: 20, height: 20, textWidth: 38, expected: null },
    { width: 56, height: 0, textWidth: 32, expected: null },
  ])('chooses $expected degrees for a $width × $height segment', ({ expected, ...bounds }) => {
    // Given: the segment dimensions and the formatted text width.
    // When
    const rotation = getBarSegmentLabelRotation(bounds);
    // Then
    expect(rotation).toBe(expected);
  });
});

describe('bar segment label contrast', () => {
  it.each([500, 300] as const)('keeps 4.5:1 contrast across the %s series palette', (shade) => {
    // Given
    const backgrounds = [blue[shade], orange[shade], teal[shade], purple[shade]];
    // When
    const labels = backgrounds.map((background) => ({
      background,
      color: getBarSegmentLabelColor(background, '#ffffff'),
    }));
    // Then
    for (const { background, color } of labels) {
      expect(getContrastRatio(background, color)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each([
    { surface: '#ffffff', composite: 'rgb(193, 225, 251)' },
    { surface: '#141414', composite: 'rgb(52, 84, 110)' },
  ])('accounts for a translucent segment on $surface', ({ surface, composite }) => {
    // Given
    const background = 'rgba(100, 181, 246, 0.4)';
    // When
    const color = getBarSegmentLabelColor(background, surface);
    // Then
    expect(getContrastRatio(composite, color)).toBeGreaterThanOrEqual(4.5);
  });
});
