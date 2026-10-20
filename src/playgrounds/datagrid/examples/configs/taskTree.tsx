import { LinearProgress } from '@mui/material';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { translate } from '../../../../shared/i18n/translate';
import type { Task } from '../../types';
import { createTree, getRowId, statuses } from '../../model/data';
import { CompletionTrendCell } from '../components/CompletionTrendCell';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export const treeRows = createTree();
const statusClasses: Readonly<Record<string, string>> = {
  '진행 중': 'status-0',
  완료: 'status-1',
  '검토 중': 'status-2',
  대기: 'status-3',
};

export const baseColumns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 175, relWidth: 1.4 },
  { id: 'task', field: 'task', header: '작업', minWidth: 175, relWidth: 1.5 },
  { id: 'owner', field: 'owner', header: '담당자', minWidth: 100, relWidth: 0.8, align: 'center' },
  {
    id: 'status',
    field: 'status',
    header: '상태',
    minWidth: 110,
    relWidth: 0.9,
    align: 'center',
    headerAlign: 'center',
    type: 'select',
    valueOptions: statuses.map((value) => ({ value, label: value })),
    renderCell: ({ row }) =>
      row.status ? (
        <span className={`status-badge ${statusClasses[row.status] ?? ''}`}>
          <span className="status-dot" />
          {translate(row.status)}
        </span>
      ) : null,
  },
  {
    id: 'quantity',
    field: 'quantity',
    header: '계획',
    type: 'number',
    minWidth: 80,
    relWidth: 0.6,
    numberOptions: { maximumFractionDigits: 0 },
  },
  {
    id: 'completed',
    field: 'completed',
    header: '완료',
    type: 'number',
    minWidth: 80,
    relWidth: 0.6,
    numberOptions: { maximumFractionDigits: 0 },
  },
  {
    id: 'completionRate',
    header: '완료율 (%)',
    type: 'number',
    minWidth: 200,
    relWidth: 1.4,
    headerAlign: 'center',
    valueGetter: (row) =>
      row.parentId !== null && row.quantity > 0 ? (row.completed / row.quantity) * 100 : undefined,
    numberOptions: { maximumFractionDigits: 1 },
    renderCell: ({ row, value }) =>
      typeof value === 'number' ? (
        <div className="progress-cell">
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, value))}
            aria-label={translate('{{task}} 완료율', { task: row.task })}
            sx={{
              flex: 1,
              height: 8,
              borderRadius: 1,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { transition: 'none' },
            }}
          />
          <span>{Math.round(value * 10) / 10}%</span>
        </div>
      ) : null,
    excel: { numFmt: '0.0"%"' },
  },
  {
    id: 'completionTrend',
    header: '완료율 추세',
    minWidth: 160,
    relWidth: 1.1,
    headerAlign: 'center',
    sortable: false,
    filterable: false,
    excel: false,
    renderCell: ({ row }) => (row.parentId !== null ? <CompletionTrendCell row={row} /> : null),
  },
  {
    id: 'date',
    field: 'date',
    header: '마감일',
    type: 'date',
    minWidth: 150,
    relWidth: 1.1,
    align: 'center',
    headerAlign: 'center',
    dateOptions: { format: 'YYYY-MM-DD' },
  },
] satisfies OwpDataGridColumn<Task>[];

export const treeOptions: OwpDataGridProps<Task, Task>['treeOptions'] = {
  mode: 'parent-reference',
  getParentRowId: (row) => row.parentId,
  defaultExpansionModel: treeRows.filter((row) => row.parentId === null).map(getRowId),
};

export const taskTreeConfiguration: OwpDataGridProps<Task, Task> = {
  rows: treeRows,
  columns: baseColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  treeOptions,
  rowReordering: { dragMode: 'selected' },
  rowSelectionPropagation: { descendants: true, parents: true },
};
