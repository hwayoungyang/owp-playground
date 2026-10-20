import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { OwpDataGridCellRowSpanKeyGetter } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';

export const spanSelectionProjectSpanKey: OwpDataGridCellRowSpanKeyGetter<Task> = ({
  row,
  column,
}) => (column.id === 'project' && row.parentId === null ? row.project : undefined);

export const spanSelectionConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  getCellRowSpanKey: spanSelectionProjectSpanKey,
  rowSelectionScope: { type: 'panelRowSpan', columnId: 'project' },
  rowDeletion: true,
};
