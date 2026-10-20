import type { OwpDataGridProps } from '@owp/datagrid/types';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import { editableTaskColumns } from './taskList';

export const taskMoveConfiguration = {
  rows: initialTasks,
  columns: editableTaskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  rowReordering: { dragMode: 'selected' },
} satisfies OwpDataGridProps<Task, Task>;
