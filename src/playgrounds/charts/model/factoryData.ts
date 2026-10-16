/** Reset과 코드 복사 후에도 같은 가상 측정값을 재현합니다. */
export function factoryNoise(index: number, seed = 17): number {
  const uniform = (offset: number) => {
    const value = Math.sin((index + 1) * 127.1 + (seed + offset) * 311.7) * 43758.5453;
    return Math.max(0.000001, value - Math.floor(value));
  };
  return Math.sqrt(-2 * Math.log(uniform(0))) * Math.cos(2 * Math.PI * uniform(1));
}

/** 생산 부하의 전환과 연속된 센서 오차를 포함한 가상 시계열입니다. */
export function createProcessSeries({
  anchors,
  count,
  seed = 17,
  volatility = 1,
}: {
  readonly anchors: readonly number[];
  readonly count: number;
  readonly seed?: number;
  readonly volatility?: number;
}): readonly number[] {
  let drift = 0;
  return Array.from({ length: count }, (_, index) => {
    const position = (index / Math.max(1, count - 1)) * (anchors.length - 1);
    const segment = Math.floor(position);
    const start = anchors[segment] ?? 0;
    const end = anchors[Math.min(segment + 1, anchors.length - 1)] ?? start;
    const progress = position - segment;
    const weight = progress * progress * (3 - 2 * progress);
    drift = drift * 0.62 + factoryNoise(index, seed) * volatility * 0.6;
    return Number((start + (end - start) * weight + drift).toFixed(2));
  });
}
