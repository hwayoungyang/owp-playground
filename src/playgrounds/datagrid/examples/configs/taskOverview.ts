import type { OwpDataGridProps, OwpDataGridSummaryRow } from '@owp/datagrid/types';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import { taskColumns } from './taskList';

export const taskSummaryRows = [
  {
    id: 'total',
    cells: [
      { columnId: 'project', value: '전체 합계' },
      { columnId: 'quantity', aggregate: 'sum' },
      { columnId: 'completed', aggregate: 'sum' },
    ],
  },
] satisfies OwpDataGridSummaryRow<Task>[];

export const taskOverviewConfiguration = {
  rows: initialTasks.slice(0, 10),
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  visibleRowCount: 10,
  summaryRows: taskSummaryRows,
} satisfies OwpDataGridProps<Task, Task>;
