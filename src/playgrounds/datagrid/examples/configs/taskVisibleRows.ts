import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const taskVisibleRowsConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks.slice(0, 10),
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  visibleRowCount: 10,
};
