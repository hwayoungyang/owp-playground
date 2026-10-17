import { createChartOptions } from '@owp/charts/utils';

const defaults = createChartOptions();
const animation = defaults.animation;
if (!animation || typeof animation.duration !== 'number' || typeof animation.easing !== 'string') {
  throw new TypeError('OWP chart motion defaults must use a numeric duration and an easing name');
}

/** OWP의 고정 애니메이션 기본값을 차트 종류에 독립적인 옵션으로 재사용합니다. */
export const chartMotion = {
  animation: { duration: animation.duration, easing: animation.easing },
  transitions: Object.fromEntries(
    Object.entries(defaults.transitions ?? {}).map(([name, transition]) => {
      const duration = transition?.animation?.duration;
      const easing = transition?.animation?.easing;
      if (typeof duration !== 'number' || (easing !== undefined && typeof easing !== 'string')) {
        throw new TypeError('OWP chart transitions must use numeric durations and easing names');
      }
      return [
        name,
        { animation: { duration, ...(easing === undefined ? {} : { easing }) } },
      ] as const;
    }),
  ),
};
