import { createChartOptions } from '@owp/charts/utils';
import { expect, it } from 'vitest';
import { chartMotion } from '../src/playgrounds/charts/model/chartMotion';

it('preserves every OWP animation and transition default used by chart examples', () => {
  // Given
  const defaults = createChartOptions();
  // When
  const motion = chartMotion;
  // Then
  expect(motion).toEqual({ animation: defaults.animation, transitions: defaults.transitions });
});
