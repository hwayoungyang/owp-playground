import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { editableTaskColumns } from './taskList';

export const conditionalStylesConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: editableTaskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
};
