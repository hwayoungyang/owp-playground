import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const taskStatesConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  noDataMessage: '표시할 작업이 없습니다.',
};
