import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, owners, statuses } from '../model/data';
import type { Definition, ExampleProps } from '../model/types';

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
  {
    id: 'cost',
    field: 'cost',
    header: '금액 (원)',
    type: 'number',
    minWidth: 180,
    relWidth: 1,
    numberOptions: { maximumFractionDigits: 0 },
  },
  { id: 'year', field: 'year', header: '연도', minWidth: 140, relWidth: 1, align: 'center' },
  { id: 'month', field: 'month', header: '연월', minWidth: 160, relWidth: 1, align: 'center' },
  {
    id: 'time',
    field: 'time',
    header: '시간',
    type: 'time',
    minWidth: 160,
    relWidth: 1,
    align: 'center',
  },
  {
    id: 'datetime',
    field: 'datetime',
    header: '일시',
    type: 'datetime',
    minWidth: 220,
    relWidth: 1.4,
    align: 'center',
  },
  {
    id: 'active',
    field: 'active',
    header: '체크',
    type: 'boolean',
    minWidth: 120,
    relWidth: 0.8,
    align: 'center',
  },
  { id: 'tags', field: 'tags', header: '태그', minWidth: 200, relWidth: 1.2 },
  { id: 'note', field: 'note', header: '메모', minWidth: 260, relWidth: 1.6 },
] satisfies OwpDataGridColumn<Task>[];

const editableColumns = baseColumns.map((column) => ({
  ...column,
  resizable: true,
  headerAlign: ['status', 'date', 'year', 'month', 'time', 'datetime'].includes(column.id)
    ? ('center' as const)
    : ('left' as const),
  editable: column.id !== 'project',
  ...(column.id === 'owner'
    ? { type: 'select' as const, valueOptions: owners.map((value) => ({ value, label: value })) }
    : {}),
}));

export const exampleDefinition: Definition = {
  rows: initialTasks,
  columns: editableColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  layout: {
    filterRow: true,
    columnRegions: [
      { id: 'fixed', mode: 'fixed', columnIds: ['project'], width: 190 },
      {
        id: 'scroll',
        mode: 'scroll',
        columnIds: baseColumns.slice(1).map((column) => column.id),
        flex: 1,
      },
    ],
  },
};

export function OwpDataGridExample(props: ExampleProps = {}) {
  const { gridRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={exampleDefinition.rows}
      columns={exampleDefinition.columns}
      getRowId={exampleDefinition.getRowId}
      rowSelectionMode={exampleDefinition.rowSelectionMode}
      height={exampleDefinition.height}
      layout={exampleDefinition.layout}
      {...gridProps}
    />
  );
}
