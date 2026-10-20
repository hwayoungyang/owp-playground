import type { OwpDataGridProps, OwpDataGridHeaderRow } from '@owp/datagrid/types';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import { taskColumns, editableTaskColumns } from './taskList';

export const groupedHeaders: readonly OwpDataGridHeaderRow[] = [
  [
    { columnId: 'project', rowSpan: 2 },
    { id: 'work', header: '작업 정보', columnIds: ['task', 'owner', 'status'] },
    { id: 'delivery', header: '진행 현황', columnIds: ['quantity', 'completed', 'date'] },
  ],
  taskColumns.slice(1).map((column) => ({ columnId: column.id })),
];

export const overviewSummary: OwpDataGridProps<Task, Task>['summaryRows'] = [
  {
    id: 'total',
    cells: [
      { columnId: 'project', value: '전체 합계' },
      { columnId: 'quantity', aggregate: 'sum' },
      { columnId: 'completed', aggregate: 'sum' },
    ],
  },
];

export const taskExcelConfiguration = {
  rows: initialTasks,
  columns: editableTaskColumns.map((column) => ({
    ...column,
    excel: column.id === 'quantity' ? { numFmt: '#,##0' } : {},
  })),
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  headerRows: groupedHeaders,
  summaryRows: overviewSummary,
} satisfies OwpDataGridProps<Task, Task>;
