import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { editableTaskColumns } from './taskList';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const serverTaskQueryConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: editableTaskColumns.map((column) => ({ ...column, editable: false })),
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  sortingMode: 'manual',
  filteringMode: 'manual',
  layout: { filterRow: true },
};
