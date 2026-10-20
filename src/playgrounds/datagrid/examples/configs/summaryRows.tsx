import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks, seedTask } from '../../model/data';
import { editableTaskColumns } from './taskList';

export const summaryRowsConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: editableTaskColumns,
  getRowId,
  height: 420,
  rowSelectionMode: 'multiple',
  layout: { filterRow: true },
  summaryRows: [
    {
      id: 'filtered-total',
      scope: 'filtered',
      cells: [
        { columnId: 'project', value: '표시된 행 합계' },
        { columnId: 'quantity', aggregate: 'sum' },
        { columnId: 'completed', aggregate: 'sum' },
      ],
    },
    {
      id: 'all-average',
      scope: 'all',
      cells: [
        { columnId: 'project', value: '전체 평균' },
        {
          columnId: 'quantity',
          aggregate: 'average',
          valueFormatter: (value) =>
            typeof value === 'number' ? value.toFixed(1) : String(value ?? ''),
        },
        {
          columnId: 'completed',
          valueGetter: ({ rows }) =>
            rows.length
              ? Math.round(rows.reduce((sum, row) => sum + row.completed, 0) / rows.length)
              : 0,
        },
      ],
    },
  ],
  pinnedBottomRows: [
    {
      ...seedTask,
      id: 'pinned-note',
      project: '안내',
      task: '고정 행은 선택·편집·집계에서 제외됩니다.',
      owner: '',
      status: '',
      date: '',
    },
  ],
  pinnedBottomRowStyle: { backgroundColor: 'var(--pg-chrome)', color: 'var(--pg-secondary)' },
};
