import { loadRows } from '../../model/server';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';
import { ProjectDetailPanel } from '../components/ProjectDetailPanel';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const projectDetailsConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks.filter((_, index) => index % 4 === 0),
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  detailPanel: {
    height: 260,
    loadRows: ({ row, signal }) =>
      loadRows(
        initialTasks.filter((task) => task.project === row.project),
        signal,
      ),
    renderDetail: (params) => <ProjectDetailPanel {...params} />,
  },
};
