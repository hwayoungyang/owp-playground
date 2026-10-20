import type { OwpDataGridProps } from '@owp/datagrid/types';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import { editableTaskColumns } from './taskList';

export const taskSelectionPolicyConfiguration = {
  rows: initialTasks,
  columns: editableTaskColumns,
  getRowId,
  height: 420,
  rowSelectionMode: 'multiple',
  allowSelectAll: false,
  defaultRowSelectionModel: ['task-1'],
  rowDeletion: true,
  layout: {
    rowPanel: {
      selectionControl: true,
      allowAddedRowSelection: true,
      deleteAction: true,
      deleteActionScope: 'added',
    },
  },
} satisfies OwpDataGridProps<Task, Task>;
