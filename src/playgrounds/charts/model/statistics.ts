export function createPareto(rows: readonly { readonly label: string; readonly count: number }[]) {
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((sum, row) => sum + row.count, 0);
  let cumulative = 0;
  return sorted.map((row) => {
    cumulative += row.count;
    return { ...row, cumulative: total ? (cumulative / total) * 100 : 0 };
  });
}

/** 같은 seed로 재현 가능한 정규분포 군집을 만듭니다. */
export function createScatterClusters(count: number) {
  let seed = 731;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return (seed + 1) / 4294967297;
  };
  return [
    [27, 70, 9, 9],
    [73, 72, 7, 7],
    [36, 28, 12, 10],
    [79, 30, 8, 8],
  ].map(([cx = 0, cy = 0, sx = 1, sy = 1]) =>
    Array.from({ length: count }, () => {
      const distance = Math.sqrt(-2 * Math.log(random()));
      const angle = 2 * Math.PI * random();
      return {
        x: cx + sx * distance * Math.cos(angle),
        y: cy + sy * distance * Math.sin(angle),
      };
    }),
  );
}
