import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';

export const columnSpanBannerRows = initialTasks.map((row, index) => ({
  ...row,
  note: index % 4 === 0 ? `${row.project} · 작업 요약` : '',
}));

export const columnSpanBannerColumns = [
  { id: 'note', field: 'note', header: '요약', minWidth: 260, relWidth: 2 },
  ...taskColumns.slice(1),
] satisfies OwpDataGridProps<Task, Task>['columns'];

export const columnSpanConfiguration: OwpDataGridProps<Task, Task> = {
  rows: columnSpanBannerRows,
  columns: columnSpanBannerColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  getCellSpan: ({ row, column }) => (row.note && column.id === 'note' ? { colSpan: 3 } : undefined),
};
