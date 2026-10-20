import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';

export const rowBackgroundBaseColumns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 150, relWidth: 1.2 },
  { id: 'task', field: 'task', header: '작업', minWidth: 180, relWidth: 1.5 },
  { id: 'status', field: 'status', header: '상태', minWidth: 110, relWidth: 0.9, align: 'center' },
  {
    id: 'quantity',
    field: 'quantity',
    header: '계획',
    type: 'number',
    minWidth: 100,
    relWidth: 0.8,
  },
  {
    id: 'completed',
    field: 'completed',
    header: '완료',
    type: 'number',
    minWidth: 100,
    relWidth: 0.8,
  },
  {
    id: 'date',
    field: 'date',
    header: '마감일',
    type: 'date',
    minWidth: 150,
    relWidth: 1.1,
    align: 'center',
    headerAlign: 'center',
    dateOptions: { format: 'YYYY-MM-DD' },
  },
] satisfies OwpDataGridColumn<Task>[];
export const rowBackgroundColumns: readonly OwpDataGridColumn<Task>[] =
  rowBackgroundBaseColumns.map((column) => ({
    ...column,
    cellStyle: ({ row }) =>
      row.status === '완료'
        ? { backgroundColor: 'var(--pg-blue-wash)', color: 'var(--pg-blue)' }
        : row.status === '검토 중'
          ? { backgroundColor: 'var(--pg-purple-wash)', color: 'var(--pg-purple)' }
          : undefined,
  }));

export const rowBackgroundConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: rowBackgroundColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
};
