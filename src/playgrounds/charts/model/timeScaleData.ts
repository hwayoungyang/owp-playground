import type { ChartTimeAdapterOptions, ChartTimePoint } from '@owp/charts/types';
import type { NativeOptions } from './chartTypes';

export const timeOrigin = Date.UTC(2026, 0, 15, 0);
export const hourInMilliseconds = 60 * 60 * 1000;

export const equipmentReadings: ChartTimePoint[] = [
  { x: timeOrigin, y: 42 },
  { x: timeOrigin + 0.25 * hourInMilliseconds, y: 44 },
  { x: timeOrigin + 0.5 * hourInMilliseconds, y: 41 },
  { x: timeOrigin + 2 * hourInMilliseconds, y: 53 },
  { x: timeOrigin + 2.25 * hourInMilliseconds, y: 57 },
  { x: timeOrigin + 5.5 * hourInMilliseconds, y: 48 },
  { x: timeOrigin + 7 * hourInMilliseconds, y: 52 },
  { x: timeOrigin + 12 * hourInMilliseconds, y: 46 },
];

export const productionReadings = [
  { actual: 158, plan: 170 },
  { actual: 172, plan: 170 },
  { actual: 169, plan: 170 },
  { actual: 184, plan: 180 },
  { actual: 176, plan: 180 },
  { actual: 162, plan: 180 },
  { actual: 192, plan: 190 },
  { actual: 198, plan: 190 },
  { actual: 187, plan: 190 },
  { actual: 180, plan: 200 },
  { actual: 194, plan: 200 },
  { actual: 201, plan: 200 },
].map((reading, index) => ({ ...reading, x: timeOrigin + index * hourInMilliseconds }));

export const sensorGapReadings: ChartTimePoint[] = [
  { x: timeOrigin, y: 63 },
  { x: timeOrigin + 0.5 * hourInMilliseconds, y: 65 },
  { x: timeOrigin + hourInMilliseconds, y: 64 },
  { x: timeOrigin + 1.5 * hourInMilliseconds, y: null },
  { x: timeOrigin + 2 * hourInMilliseconds, y: 68 },
  { x: timeOrigin + 3 * hourInMilliseconds, y: 69 },
  { x: timeOrigin + 6 * hourInMilliseconds, y: 72 },
  { x: timeOrigin + 6.5 * hourInMilliseconds, y: 71 },
  { x: timeOrigin + 7 * hourInMilliseconds, y: null },
  { x: timeOrigin + 8 * hourInMilliseconds, y: 67 },
  { x: timeOrigin + 16 * hourInMilliseconds, y: 66 },
  { x: timeOrigin + 16.5 * hourInMilliseconds, y: 68 },
];

export function createTimeOptions(language: string, type: 'time' | 'timeseries'): NativeOptions {
  const adapterOptions: ChartTimeAdapterOptions = { zone: 'UTC', locale: language };
  const tickFormat = new Intl.DateTimeFormat(language, {
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  const tooltipFormat = new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  });
  return {
    locale: language,
    parsing: false,
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    plugins: {
      tooltip: {
        callbacks: {
          title: (items) => {
            const x = items[0]?.parsed.x;
            return x === undefined || x === null ? '' : `${tooltipFormat.format(x)} UTC`;
          },
        },
      },
    },
    scales: {
      x: {
        type,
        adapters: { date: adapterOptions },
        time: { unit: 'hour', tooltipFormat: 'ff' },
        ticks: {
          source: 'data',
          maxRotation: 0,
          maxTicksLimit: 6,
          callback: (value) => tickFormat.format(Number(value)),
        },
      },
      y: { beginAtZero: false },
    },
  };
}
