import type { OwpDataGridProps, OwpDataGridRowSelectionMode } from '@owp/datagrid/types';
import type { Task } from './data';

export type GridConfiguration = OwpDataGridProps<Task, Task>;
export type GridViewProps = Partial<GridConfiguration> & {
  readonly onRecord?: (name: string, value: unknown) => void;
  readonly onRowsChange?: (rows: readonly Task[]) => void;
  readonly onBusyChange?: (busy: boolean) => void;
  readonly onRadiusChange?: (radius: number) => void;
  readonly onSelectionModeChange?: (mode: OwpDataGridRowSelectionMode) => void;
};
