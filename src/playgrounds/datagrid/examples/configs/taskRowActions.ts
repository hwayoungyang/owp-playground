import type { OwpDataGridProps } from '@owp/datagrid/types';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import { editableTaskColumns } from './taskList';

export const taskRowActionsConfiguration = {
  rows: initialTasks,
  columns: editableTaskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  rowDeletion: { showDeletedRows: true },
  rowEditToolbar: { showDeleteSelectedRows: true, showUndoDelete: true, showResetChanges: true },
} satisfies OwpDataGridProps<Task, Task>;
