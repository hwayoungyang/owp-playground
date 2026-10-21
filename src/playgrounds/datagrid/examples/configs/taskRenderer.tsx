import type { useOwpTranslation } from '@owp/components/hooks';
import type { OwpDataGridColumn, OwpDataGridProps } from '@owp/datagrid/types';
import { getRowId, initialTasks } from '../../model/data';
import type { Task } from '../../types';
import {
  RendererActionCell,
  RendererNotificationCell,
  RendererProgressCell,
  RendererStatusCell,
} from '../components/TaskRendererCells';

export function createTaskRendererColumns(
  t?: ReturnType<typeof useOwpTranslation>['t'],
  actions?: {
    readonly complete: (row: Task) => void;
    readonly toggle: (row: Task, checked: boolean) => void;
  },
): OwpDataGridColumn<Task>[] {
  return [
    { id: 'project', field: 'project', header: '프로젝트', minWidth: 150, relWidth: 1 },
    { id: 'task', field: 'task', header: '작업', minWidth: 180, relWidth: 1.3 },
    {
      id: 'status',
      field: 'status',
      header: '상태',
      minWidth: 140,
      relWidth: 0.8,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => <RendererStatusCell row={row} />,
      excel: { valueGetter: ({ row }) => t?.(row.status) ?? row.status },
    },
    {
      id: 'progress',
      field: 'completed',
      header: '진행률',
      minWidth: 160,
      relWidth: 1,
      type: 'number',
      valueGetter: (row) =>
        row.quantity > 0 ? Math.round((row.completed / row.quantity) * 100) : 0,
      valueSetter: ({ row, nextValue }) =>
        typeof nextValue === 'number'
          ? {
              ...row,
              completed: Math.round((row.quantity * Math.max(0, Math.min(100, nextValue))) / 100),
            }
          : row,
      renderCell: ({ row, value }) => <RendererProgressCell row={row} value={value} />,
      excel: { numFmt: '0"%"' },
    },
    {
      id: 'active',
      field: 'active',
      header: '알림',
      minWidth: 100,
      relWidth: 0.6,
      align: 'center',
      headerAlign: 'center',
      type: 'boolean',
      renderCell: ({ row }) => <RendererNotificationCell row={row} onToggle={actions?.toggle} />,
      excel: {
        valueGetter: ({ row }) =>
          t?.(row.active ? '켜짐' : '꺼짐') ?? (row.active ? '켜짐' : '꺼짐'),
      },
    },
    {
      id: 'action',
      header: '완료 처리',
      minWidth: 140,
      relWidth: 0.9,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => <RendererActionCell row={row} onComplete={actions?.complete} />,
      excel: false,
    },
  ];
}

export const taskRendererConfiguration = {
  rows: initialTasks,
  columns: createTaskRendererColumns(),
  getRowId,
  rowSelectionMode: 'none',
  height: 420,
} satisfies OwpDataGridProps<Task, Task>;
