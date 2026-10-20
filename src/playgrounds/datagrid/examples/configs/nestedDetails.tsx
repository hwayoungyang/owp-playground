import { loadRows } from '../../model/server';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';
import { DetailGrid } from '../components/DetailGrid';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const nestedDetailsConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks
    .filter((_, index) => index % 4 === 0)
    .map((row, index) => ({ ...row, task: `주문 ORD-${String(index + 1).padStart(3, '0')}` })),
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  detailPanel: {
    height: 280,
    loadRows: ({ row, signal }) =>
      loadRows(
        initialTasks.filter((task) => task.project === row.project),
        signal,
      ),
    renderDetail: (params) => <DetailGrid {...params} />,
  },
};
