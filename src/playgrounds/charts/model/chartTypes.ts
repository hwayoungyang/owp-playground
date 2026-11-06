import type { ChartCanvasProps } from '@owp/charts/types';

export type NativeChartType = 'bar' | 'line' | 'doughnut' | 'scatter' | 'bubble';
export type NativeValue =
  | number
  | [number, number]
  | { x: number; y: number | null; r?: number }
  | null;
type CanvasProps = ChartCanvasProps<NativeChartType, NativeValue[]>;
export type NativeData = Omit<CanvasProps['data'], 'datasets'> & {
  readonly datasets: (CanvasProps['data']['datasets'][number] & { readonly id?: string })[];
};
export type NativeOptions = NonNullable<CanvasProps['options']>;
export type NativePlugin = NonNullable<CanvasProps['plugins']>[number];
export type NativeInstance = NonNullable<
  Extract<CanvasProps['chartRef'], { current: unknown }>['current']
>;
