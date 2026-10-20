import type { Task } from '../../types';
import { createTree, getRowId, initialTasks } from '../../model/data';
import { loadRows } from '../../model/server';
import { editableTaskColumns } from './taskList';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const lazyTaskTreeConfiguration: OwpDataGridProps<Task, Task> = {
  rows: createTree().filter((row) => row.parentId === null),
  columns: editableTaskColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  treeOptions: {
    mode: 'parent-reference',
    getParentRowId: (row) => row.parentId,
    getRowCanExpand: (row) => row.parentId === null,
    lazyChildren: {
      loadChildren: ({ row, signal }) =>
        loadRows(
          initialTasks
            .filter((task) => task.project === row.project)
            .map((task) => ({ ...task, parentId: row.id })),
          signal,
        ),
    },
    filterFromLeafRows: true,
  },
  rowSelectionPropagation: { descendants: true, parents: false },
};
