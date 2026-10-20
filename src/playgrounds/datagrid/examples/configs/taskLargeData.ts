import type { Task } from '../../types';
import { createTasks, getRowId } from '../../model/data';
import { taskColumns } from './taskList';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const taskLargeDataConfiguration: OwpDataGridProps<Task, Task> = {
  rows: createTasks(10000),
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  virtualization: { rowHeight: 36 },
};
