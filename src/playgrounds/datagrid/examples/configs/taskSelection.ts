import type { OwpDataGridProps } from '@owp/datagrid/types';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import { taskColumns } from './taskList';

export const taskSelectionConfiguration = {
  rows: initialTasks,
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'single',
  height: 420,
} satisfies OwpDataGridProps<Task, Task>;
