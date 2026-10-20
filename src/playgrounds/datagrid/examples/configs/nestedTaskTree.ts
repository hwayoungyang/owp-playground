import type { Task } from '../../types';
import { createNestedTree, getRowId } from '../../model/data';
import { editableTaskColumns } from './taskList';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const nestedTaskTreeConfiguration: OwpDataGridProps<Task, Task> = {
  rows: createNestedTree(),
  columns: editableTaskColumns,
  getRowId,
  height: 420,
  rowSelectionMode: 'multiple',
  treeOptions: {
    mode: 'nested',
    getChildren: (row) => row.children,
    defaultExpansionModel: ['project-0', 'phase-0-0', 'work-0-0-0'],
    filterFromLeafRows: true,
    indentation: 20,
  },
  rowSelectionPropagation: { descendants: true, parents: true },
  layout: { filterRow: true },
};
