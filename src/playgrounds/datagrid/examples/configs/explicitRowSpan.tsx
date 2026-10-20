import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';

export const explicitRowSpanConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  getCellSpan: ({ column, displayIndex }) =>
    column.id === 'project' && displayIndex !== undefined && displayIndex % 4 === 0
      ? { rowSpan: 4 }
      : undefined,
};
