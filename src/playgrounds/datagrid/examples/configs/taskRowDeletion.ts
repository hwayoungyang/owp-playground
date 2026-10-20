import type { OwpDataGridProps } from '@owp/datagrid/types';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import { editableTaskColumns } from './taskList';

export const taskRowDeletionConfiguration = {
  rows: initialTasks,
  columns: editableTaskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  rowDeletion: { showDeletedRows: true },
  rowAnimation: true,
  layout: { rowPanel: { allowAddedRowSelection: true } },
} satisfies OwpDataGridProps<Task, Task>;
