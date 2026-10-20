import type { OwpDataGridProps } from '@owp/datagrid/types';
import { getRowId, createTasks } from '../../model/data';
import type { Task } from '../../types';
import { editableTaskColumns } from './taskList';

export const taskExcelSnapshotConfiguration = {
  rows: createTasks(10000),
  columns: editableTaskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  virtualization: { rowHeight: 36 },
} satisfies OwpDataGridProps<Task, Task>;
