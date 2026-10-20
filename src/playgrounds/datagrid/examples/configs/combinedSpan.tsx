import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { OwpDataGridCellRowSpanKeyGetter, OwpDataGridHeaderRow } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';

export const combinedSpanBannerRows = initialTasks.map((row, index) => ({
  ...row,
  note: index % 4 === 0 ? `${row.project} · 작업 요약` : '',
  task: index % 4 === 0 ? `${row.project} · 작업 요약` : row.task,
}));

export const combinedSpanProjectSpanKey: OwpDataGridCellRowSpanKeyGetter<Task> = ({
  row,
  column,
}) => (column.id === 'project' && row.parentId === null ? row.project : undefined);

export const combinedSpanGroupedHeaders: readonly OwpDataGridHeaderRow[] = [
  [
    { columnId: 'project', rowSpan: 2 },
    { id: 'work', header: '작업 정보', columnIds: ['task', 'owner', 'status'] },
    { id: 'delivery', header: '진행 현황', columnIds: ['quantity', 'completed', 'date'] },
  ],
  taskColumns.slice(1).map((column) => ({ columnId: column.id })),
];

export const combinedSpanConfiguration: OwpDataGridProps<Task, Task> = {
  rows: combinedSpanBannerRows,
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  getCellRowSpanKey: combinedSpanProjectSpanKey,
  getCellSpan: ({ row, column }) => (row.note && column.id === 'task' ? { colSpan: 2 } : undefined),
  headerRows: combinedSpanGroupedHeaders,
};
