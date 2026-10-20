import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { SxProps, Theme } from '@mui/material/styles';
import type { OwpDataGridColumn, OwpDataGridHeaderRow } from '@owp/datagrid/types';
import { getRowId, initialTasks, owners } from '../../model/data';
import type { Task } from '../../types';

export const styledHeadersColumns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 150, relWidth: 1 },
  {
    id: 'task',
    field: 'task',
    header: '작업',
    minWidth: 220,
    relWidth: 1.8,
    editable: true,
    cellStyle: { fontStyle: 'italic' },
  },
  {
    id: 'owner',
    field: 'owner',
    header: '담당자',
    minWidth: 150,
    relWidth: 1,
    type: 'select',
    editable: true,
    autocompleteOptions: {},
    valueOptions: owners.map((value) => ({ value, label: value })),
  },
  { id: 'note', field: 'note', header: '메모', minWidth: 220, relWidth: 1.8, editable: true },
] satisfies OwpDataGridColumn<Task>[];

export const styledHeadersGroupedHeaders: readonly OwpDataGridHeaderRow[] = [
  [
    { columnId: 'project', rowSpan: 2 },
    { id: 'work', header: '작업 정보', columnIds: ['task', 'owner'], align: 'center' },
    { columnId: 'note', rowSpan: 2 },
  ],
  [{ columnId: 'task' }, { columnId: 'owner' }],
];

export const styledHeadersBaseSx = {
  '& .OwpDataGrid-root': { boxShadow: { xs: 1, md: 2 } },
  '& .OwpDataGrid-headerCell': { fontWeight: 700 },
  '& .OwpDataGrid-cell:not([data-owp-data-grid-editing="true"])': {
    px: { xs: 0.5, md: 1.5 },
    '& .OwpDataGrid-cellContent': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      letterSpacing: '0.02em',
    },
  },
} satisfies SxProps<Theme>;

export const styledHeadersStateSx = (theme: Theme) => ({
  '& .OwpDataGrid-cell': { fontFamily: theme.typography.fontFamily },
  '& .OwpDataGrid-cell:not([data-owp-data-grid-editing="true"]):hover .OwpDataGrid-cellContent': {
    color: 'var(--pg-blue)',
  },
  '& .OwpDataGrid-cell:focus-within .OwpDataGrid-cellContent': { fontWeight: 600 },
});

export const styledHeadersConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks.map((row, index) => ({
    ...row,
    note:
      index === 0
        ? '프로젝트 검토에서 정리한 요구사항과 후속 작업을 확인하고 다음 단계의 일정에 함께 반영합니다.'
        : row.note,
  })),
  columns: styledHeadersColumns,
  headerRows: styledHeadersGroupedHeaders,
  getRowId,
  rowSelectionMode: 'none',
  height: 420,
};
