import { createProcessSeries } from './factoryData';

export const processNames = ['절단', '가공', '용접', '조립', '검사', '포장'] as const;
export const processValues = [
  [2.5, 2.8, 3.1],
  [2.7, 2.5, 3],
  [2.1, 2.6, 2.4],
  [1, 0.7, 0.9],
  [0.8, 0.5, 0.7],
  [0.4, 0.6, 0.5],
] as const;
export const years = ['2023', '2024', '2025'] as const;

export const processReadings = createProcessSeries({
  anchors: [-0.23, -0.12, -0.3, -0.08, -0.15, 0.08, -0.02, 0.21, 0.13, 0.38, 0.31, 0.48],
  count: 53,
  seed: 72,
  volatility: 0.09,
}).map((value, index) => ({
  timestamp: Date.UTC(2026, 8, 1 + index),
  value,
}));

export const areaReadings = createProcessSeries({
  anchors: [26, 44, 56, 48, 18, 4, -18, -39, -27, -6, 18, 47, 67, 61],
  count: 181,
  seed: 43,
  volatility: 3.2,
}).map((value, index) => ({
  day: index,
  value,
}));
