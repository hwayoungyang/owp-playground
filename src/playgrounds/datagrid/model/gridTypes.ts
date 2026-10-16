import type {
  OwpDataGridProps,
  OwpDataGridRef,
  OwpDataGridRowSelectionMode,
} from '@owp/datagrid/types';
import type { RefObject } from 'react';
import type { Task } from './data';

export type GridConfiguration = OwpDataGridProps<Task, Task>;
export type GridViewProps = Partial<GridConfiguration> & {
  readonly gridRef?: RefObject<OwpDataGridRef<Task> | null>;
  readonly onRecord?: (name: string, value: unknown) => void;
  readonly onRowsChange?: (rows: readonly Task[]) => void;
  readonly onBusyChange?: (busy: boolean) => void;
  readonly onRadiusChange?: (radius: number) => void;
  readonly onSelectionModeChange?: (mode: OwpDataGridRowSelectionMode) => void;
};
