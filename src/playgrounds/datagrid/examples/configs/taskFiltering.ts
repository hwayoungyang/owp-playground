import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const taskFilteringConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  layout: { filterRow: true },
};
