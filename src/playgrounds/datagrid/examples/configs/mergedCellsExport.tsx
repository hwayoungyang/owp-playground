import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { OwpDataGridCellRowSpanKeyGetter, OwpDataGridHeaderRow } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks, seedTask } from '../../model/data';
import { taskColumns } from './taskList';

export const mergedCellsExportGroupedHeaders: readonly OwpDataGridHeaderRow[] = [
  [
    { columnId: 'project', rowSpan: 2 },
    { id: 'work', header: '작업 정보', columnIds: ['task', 'owner', 'status'] },
    { id: 'delivery', header: '진행 현황', columnIds: ['quantity', 'completed', 'date'] },
  ],
  taskColumns.slice(1).map((column) => ({ columnId: column.id })),
];

export const mergedCellsExportProjectSpanKey: OwpDataGridCellRowSpanKeyGetter<Task> = ({
  row,
  column,
}) => (column.id === 'project' && row.parentId === null ? row.project : undefined);

export const mergedCellsExportConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  headerRows: mergedCellsExportGroupedHeaders,
  getCellRowSpanKey: mergedCellsExportProjectSpanKey,
  pinnedBottomRows: [
    {
      ...seedTask,
      id: 'pinned-total',
      project: '프로젝트 합계',
      task: '',
      owner: '',
      status: '',
      quantity: initialTasks.reduce((sum, row) => sum + row.quantity, 0),
      completed: initialTasks.reduce((sum, row) => sum + row.completed, 0),
      date: '',
    },
  ],
};
