import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';
import { taskColumns } from './taskList';

export const rowCellTypesConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks,
  columns: [
    ...taskColumns.slice(0, 2),
    {
      id: 'mixed',
      field: 'mixed',
      header: '숫자·텍스트',
      minWidth: 240,
      relWidth: 2,
      editable: true,
      getCellType: ({ row }) => (typeof row.mixed === 'number' ? 'number' : 'text'),
    },
  ],
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
};
