import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks, owners } from '../../model/data';

export const autocompleteEditorsColumns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 175, relWidth: 1.4 },
  { id: 'task', field: 'task', header: '작업', minWidth: 175, relWidth: 1.5 },
  {
    id: 'owner',
    field: 'owner',
    header: '담당자 검색',
    minWidth: 170,
    relWidth: 1.4,
    align: 'center',
    headerAlign: 'center',
    type: 'select',
    editable: true,
    autocompleteOptions: {},
    getValueOptions: () => owners.map((value) => ({ value, label: value })),
  },
] satisfies OwpDataGridColumn<Task>[];

export const autocompleteEditorsConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: autocompleteEditorsColumns,
  getRowId,
  rowSelectionMode: 'none',
  height: 420,
};
