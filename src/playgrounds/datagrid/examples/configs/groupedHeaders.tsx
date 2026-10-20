import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { OwpDataGridHeaderRow } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';

export const groupedHeadersGroupedHeaders: readonly OwpDataGridHeaderRow[] = [
  [
    { columnId: 'project', rowSpan: 2 },
    { id: 'work', header: '작업 정보', columnIds: ['task', 'owner', 'status'] },
    { id: 'delivery', header: '진행 현황', columnIds: ['quantity', 'completed', 'date'] },
  ],
  taskColumns.slice(1).map((column) => ({ columnId: column.id })),
];

export const groupedHeadersConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  headerRows: groupedHeadersGroupedHeaders,
  hideChildHeaderSortButtons: false,
};
