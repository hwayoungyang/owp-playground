import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { getRowId, initialTasks, owners, statuses } from '../../model/data';
import type { Task } from '../../types';

export const selectEditorsTagOptions = [
  { value: 'design', label: '디자인' },
  { value: 'web', label: '웹' },
  { value: 'mobile', label: '모바일' },
  { value: 'qa', label: '검증' },
] as const;

export const selectEditorsColumns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 150, relWidth: 1 },
  { id: 'task', field: 'task', header: '작업', minWidth: 180, relWidth: 1.4 },
  {
    id: 'tags',
    field: 'tags',
    header: '태그',
    minWidth: 140,
    relWidth: 0.9,
    type: 'select',
    editable: true,
    valueOptions: selectEditorsTagOptions,
  },
  {
    id: 'owner',
    field: 'owner',
    header: '담당자',
    minWidth: 100,
    relWidth: 0.7,
    type: 'select',
    editable: true,
    valueOptions: owners.map((value) => ({ value, label: value })),
  },
  {
    id: 'status',
    field: 'status',
    header: '상태',
    minWidth: 110,
    relWidth: 0.8,
    type: 'select',
    editable: true,
    valueOptions: statuses.map((value) => ({ value, label: value })),
  },
  {
    id: 'quantity',
    field: 'quantity',
    header: '계획',
    minWidth: 85,
    relWidth: 0.6,
    type: 'number',
    editable: true,
  },
  {
    id: 'completed',
    field: 'completed',
    header: '완료',
    minWidth: 85,
    relWidth: 0.6,
    type: 'number',
    editable: true,
  },
  {
    id: 'date',
    field: 'date',
    header: '마감일',
    minWidth: 150,
    relWidth: 1,
    type: 'date',
    editable: true,
    align: 'center',
    headerAlign: 'center',
    dateOptions: { format: 'YYYY-MM-DD' },
  },
] satisfies OwpDataGridColumn<Task>[];

export const selectEditorsConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks.map((row) => ({ ...row, tags: row.tags.split(',')[0] ?? '' })),
  columns: selectEditorsColumns,
  getRowId,
  rowSelectionMode: 'none',
  height: 420,
};
