import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { OwpDataGridCellRowSpanKeyGetter } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';

export const automaticRowSpanProjectSpanKey: OwpDataGridCellRowSpanKeyGetter<Task> = ({
  row,
  column,
}) => (column.id === 'project' && row.parentId === null ? row.project : undefined);

export const automaticRowSpanConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks.map((row, index) => ({
    ...row,
    project: index < 2 ? '웹 서비스' : index < 7 ? '모바일 앱' : '업무 시스템',
  })),
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  getCellRowSpanKey: automaticRowSpanProjectSpanKey,
  layout: { filterRow: true },
};
