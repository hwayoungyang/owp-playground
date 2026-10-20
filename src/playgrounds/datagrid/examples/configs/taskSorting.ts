import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const taskSortingConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  defaultSortModel: [
    { columnId: 'project', direction: 'asc' },
    { columnId: 'quantity', direction: 'desc' },
  ],
  sortInteraction: 'priority',
  maxSortColumns: 3,
};
