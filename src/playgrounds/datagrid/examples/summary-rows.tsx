import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, owners, seedTask, statuses } from '../model/data';
import type { GridConfiguration, GridViewProps } from '../model/gridTypes';

const statusClasses: Readonly<Record<string, string>> = {
  '진행 중': 'status-0',
  완료: 'status-1',
  '검토 중': 'status-2',
  대기: 'status-3',
};

const baseColumns = [
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

const editableColumns = baseColumns.map((column) => ({
  ...column,
  resizable: true,
  headerAlign: 'center' as const,
  editable: column.id !== 'project',
  ...(column.id === 'owner'
    ? { type: 'select' as const, valueOptions: owners.map((value) => ({ value, label: value })) }
    : {}),
}));

export const gridConfiguration: GridConfiguration = {
  rows: initialTasks,
  columns: editableColumns,
  getRowId,
  height: 420,
  rowSelectionMode: 'multiple',
  layout: { filterRow: true },
  summaryRows: [
    {
      id: 'filtered-total',
      scope: 'filtered',
      cells: [
        { columnId: 'project', value: '표시된 행 합계' },
        { columnId: 'quantity', aggregate: 'sum' },
        { columnId: 'completed', aggregate: 'sum' },
      ],
    },
    {
      id: 'all-average',
      scope: 'all',
      cells: [
        { columnId: 'project', value: '전체 평균' },
        {
          columnId: 'quantity',
          aggregate: 'average',
          valueFormatter: (value) =>
            typeof value === 'number' ? value.toFixed(1) : String(value ?? ''),
        },
        {
          columnId: 'completed',
          valueGetter: ({ rows }) =>
            rows.length
              ? Math.round(rows.reduce((sum, row) => sum + row.completed, 0) / rows.length)
              : 0,
        },
      ],
    },
  ],
  pinnedBottomRows: [
    {
      ...seedTask,
      id: 'pinned-note',
      project: '안내',
      task: '고정 행은 선택·편집·집계에서 제외됩니다.',
      owner: '',
      status: '',
      date: '',
    },
  ],
  pinnedBottomRowStyle: { backgroundColor: 'var(--pg-chrome)', color: 'var(--pg-secondary)' },
};
export function SummaryRowsGrid(props: GridViewProps = {}) {
  const { gridRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={initialTasks}
      columns={editableColumns}
      getRowId={getRowId}
      height={420}
      rowSelectionMode="multiple"
      layout={{ filterRow: true }}
      summaryRows={gridConfiguration.summaryRows}
      pinnedBottomRows={gridConfiguration.pinnedBottomRows}
      pinnedBottomRowStyle={gridConfiguration.pinnedBottomRowStyle}
      {...gridProps}
    />
  );
}
