import type { Task } from '../../types';
import { createTree, getRowId } from '../../model/data';
import { taskColumns } from './taskList';
import type { OwpDataGridProps } from '@owp/datagrid/types';

const treeRows = createTree();

export const treeOptions: OwpDataGridProps<Task, Task>['treeOptions'] = {
  mode: 'parent-reference',
  getParentRowId: (row) => row.parentId,
  defaultExpansionModel: treeRows.filter((row) => row.parentId === null).map(getRowId),
};

export const spanningTaskTreeConfiguration: OwpDataGridProps<Task, Task> = {
  rows: treeRows,
  columns: taskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  treeOptions,
  getCellRowSpanKey: ({ row, column }) =>
    column.id === 'project' && row.parentId !== null ? `${row.parentId}:${row.project}` : undefined,
};
