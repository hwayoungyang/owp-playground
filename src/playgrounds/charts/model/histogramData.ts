import { factoryNoise } from './factoryData';

export const histogramDistributions = ['정규 분포', '이중 봉우리', '오른쪽 치우침'] as const;
export type HistogramDistribution = (typeof histogramDistributions)[number];

/** 분포 유형과 갱신 순서로 재현할 수 있는 가상 측정값을 생성합니다. */
export function createHistogramMeasurements({
  count,
  distribution,
  sequence,
}: {
  readonly count: number;
  readonly distribution: HistogramDistribution;
  readonly sequence: number;
}): readonly number[] {
  const center = 50 + Math.sin(sequence * 0.65) * 3;
  return Array.from({ length: count }, (_, index) => {
    const noise = factoryNoise(index, 173 + sequence * 31);
    const offsets = {
      '정규 분포': noise * 4.5,
      '이중 봉우리': (index % 2 === 0 ? -8 : 8) + noise * 2.5,
      '오른쪽 치우침': (Math.exp(noise * 0.55) - 1) * 7,
    } satisfies Readonly<Record<HistogramDistribution, number>>;
    return Number((center + offsets[distribution]).toFixed(2));
  });
}
