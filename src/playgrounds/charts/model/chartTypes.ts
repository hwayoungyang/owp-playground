import type { CoreChartProps } from '@owp/charts/types';

export type NativeChartType = 'bar' | 'line' | 'doughnut';
export type NativeValue = number | [number, number] | { x: number; y: number; r?: number } | null;
type CoreProps = CoreChartProps<NativeChartType, NativeValue[]>;
export type NativeData = Omit<CoreProps['data'], 'datasets'> & {
  readonly datasets: (CoreProps['data']['datasets'][number] & { readonly id?: string })[];
};
export type NativeOptions = NonNullable<CoreProps['options']>;
export type NativePlugin = NonNullable<CoreProps['plugins']>[number];
export type NativeInstance = NonNullable<
  Extract<CoreProps['chartRef'], { current: unknown }>['current']
>;
