import type { OwpDataGridProps } from '@owp/datagrid/types';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import { taskColumns } from './taskList';

export const taskReorderingConfiguration = {
  rows: initialTasks,
  columns: taskColumns.map((column) => ({ ...column, sortable: false, filterable: false })),
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  rowReordering: { dragMode: 'selected' },
} satisfies OwpDataGridProps<Task, Task>;
