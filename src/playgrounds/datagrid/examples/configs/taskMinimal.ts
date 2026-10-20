import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const taskMinimalConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: taskColumns.slice(0, 3),
  getRowId,
  rowSelectionMode: 'none',
  height: 420,
  canTotalCountRow: false,
};
