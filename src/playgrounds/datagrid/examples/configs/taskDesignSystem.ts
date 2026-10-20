import type { OwpDataGridProps } from '@owp/datagrid/types';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import { taskColumns } from './taskList';

export const taskDesignSystemConfiguration = {
  rows: initialTasks,
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  rowDeletion: true,
} satisfies OwpDataGridProps<Task, Task>;
