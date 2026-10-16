import { createChartOptions } from '@owp/charts/utils';

const defaults = createChartOptions();

/** OWP preset에도 패키지의 일반 차트 애니메이션 기본값을 적용합니다. */
export const chartMotion = {
  animation: defaults.animation,
  transitions: defaults.transitions,
};
