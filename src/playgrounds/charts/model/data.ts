import type { ApiRow } from '../../../features/code/api-data';
import { chartFromApi } from './apiData';
import { factoryNoise } from './factoryData';

export const monthlyApiRows: readonly ApiRow[] = Array.from({ length: 12 }, (_, index) => {
  const plan = [86, 92, 104, 108, 96, 110, 120, 115, 124, 126, 132, 128][index] ?? 0;
  const actual = [84, 90, 108, 102, 78, 112, 118, 101, 126, 114, 130, 121][index] ?? 0;
  const lineA = Math.round(
    actual *
      ([0.44, 0.43, 0.47, 0.45, 0.39, 0.46, 0.48, 0.42, 0.47, 0.44, 0.49, 0.46][index] ?? 0.45),
  );
  const lineB = Math.round(
    actual *
      ([0.32, 0.35, 0.31, 0.33, 0.36, 0.32, 0.3, 0.35, 0.31, 0.34, 0.3, 0.33][index] ?? 0.33),
  );
  const availability =
    [92.4, 94.1, 95.3, 91.8, 83.6, 93.2, 96.1, 88.7, 95.8, 92.6, 96.4, 94.7][index] ?? 90;
  const performance =
    [91.2, 92.8, 94.6, 91.5, 88.4, 93.1, 95.4, 90.2, 96.2, 92.7, 95.8, 94.6][index] ?? 90;
  const quality =
    [97.6, 98.1, 98.4, 97.9, 96.8, 98.2, 98.7, 97.4, 98.8, 98.2, 99.1, 98.6][index] ?? 98;
  return {
    'OWP_DATA.DATA1': String(index + 1), // 월
    'OWP_DATA.DATA2': String(plan), // 계획 생산량
    'OWP_DATA.DATA3': String(actual), // 실제 생산량
    'OWP_DATA.DATA4': String(lineA), // 라인 A
    'OWP_DATA.DATA5': String(lineB), // 라인 B
    'OWP_DATA.DATA6': String(actual - lineA - lineB), // 라인 C
    'OWP_DATA.DATA7': String(Math.round((actual / plan) * 1000) / 10), // 달성률
    'OWP_DATA.DATA8': String(availability),
    'OWP_DATA.DATA9': String(performance),
    'OWP_DATA.DATA10': String(quality),
    'OWP_DATA.DATA11': String(Math.round((availability * performance * quality) / 1000) / 10),
    'OWP_DATA.DATA12': String(
      [0.62, 0.69, 0.76, 0.67, 0.48, 0.74, 0.86, 0.61, 0.91, 0.81, 1.04, 0.96][index] ?? 0,
    ),
    'OWP_DATA.DATA13': String(
      [188, 201, 216, 192, 154, 209, 234, 181, 251, 225, 267, 258][index] ?? 0,
    ),
  };
});

const monthlySeries = chartFromApi(monthlyApiRows, [
  'plan',
  'actual',
  'lineA',
  'lineB',
  'lineC',
  'rate',
  'availability',
  'performance',
  'quality',
  'oee',
  'mttf',
  'mtbf',
]);
export const monthlyRecords = monthlySeries.labels.map((category, index) => ({
  category,
  plan: monthlySeries.series[0]?.values[index] ?? 0,
  actual: monthlySeries.series[1]?.values[index] ?? 0,
  lineA: monthlySeries.series[2]?.values[index] ?? 0,
  lineB: monthlySeries.series[3]?.values[index] ?? 0,
  lineC: monthlySeries.series[4]?.values[index] ?? 0,
  rate: monthlySeries.series[5]?.values[index] ?? 0,
  availability: monthlySeries.series[6]?.values[index] ?? 0,
  performance: monthlySeries.series[7]?.values[index] ?? 0,
  quality: monthlySeries.series[8]?.values[index] ?? 0,
  oee: monthlySeries.series[9]?.values[index] ?? 0,
  mttf: monthlySeries.series[10]?.values[index] ?? 0,
  mtbf: monthlySeries.series[11]?.values[index] ?? 0,
}));

export type Measurement = { readonly timestamp: number; readonly value: number };
export function createMeasurements(count: number): readonly Measurement[] {
  return Array.from({ length: count }, (_, index) => ({
    timestamp: Date.UTC(2026, 0, 1, 8) + index * 1000,
    value:
      42 +
      Math.sin(index / 1700) * 1.5 +
      factoryNoise(index, 31) * 1.8 +
      (index % 997 === 0 ? 16 : 0),
  }));
}
