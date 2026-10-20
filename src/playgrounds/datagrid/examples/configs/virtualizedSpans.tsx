import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { OwpDataGridCellRowSpanKeyGetter } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { createTasks, getRowId } from '../../model/data';
import { taskColumns } from './taskList';

export const virtualizedSpansProjectSpanKey: OwpDataGridCellRowSpanKeyGetter<Task> = ({
  row,
  column,
}) => (column.id === 'project' && row.parentId === null ? row.project : undefined);

export const virtualizedSpansConfiguration: OwpDataGridProps<Task, Task> = {
  rows: createTasks(10000),
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  getCellRowSpanKey: virtualizedSpansProjectSpanKey,
  virtualization: { overscan: 8 },
};
