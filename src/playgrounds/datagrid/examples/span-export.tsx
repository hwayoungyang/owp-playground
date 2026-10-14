import { OwpDataGrid } from '@owp/datagrid';
import type {
  OwpDataGridCellRowSpanKeyGetter,
  OwpDataGridColumn,
  OwpDataGridHeaderRow,
} from '@owp/datagrid/types';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, seedTask, statuses } from '../model/data';
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
] satisfies OwpDataGridColumn<Task>[];

const groupedHeaders: readonly OwpDataGridHeaderRow[] = [
  [
    { columnId: 'project', rowSpan: 2 },
    { id: 'work', header: '작업 정보', columnIds: ['task', 'owner', 'status'] },
    { id: 'delivery', header: '진행 현황', columnIds: ['quantity', 'completed', 'date'] },
  ],
  baseColumns.slice(1).map((column) => ({ columnId: column.id })),
];

const projectSpanKey: OwpDataGridCellRowSpanKeyGetter<Task> = ({ row, column }) =>
  column.id === 'project' && row.parentId === null ? row.project : undefined;

export const exampleDefinition: Definition = {
  rows: initialTasks,
  columns: baseColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  headerRows: groupedHeaders,
  getCellRowSpanKey: projectSpanKey,
  pinnedBottomRows: [
    {
      ...seedTask,
      id: 'pinned-total',
      project: '프로젝트 합계',
      task: '',
      owner: '',
      status: '',
      quantity: initialTasks.reduce((sum, row) => sum + row.quantity, 0),
      completed: initialTasks.reduce((sum, row) => sum + row.completed, 0),
      date: '',
    },
  ],
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
      headerRows={exampleDefinition.headerRows}
      getCellRowSpanKey={exampleDefinition.getCellRowSpanKey}
      pinnedBottomRows={exampleDefinition.pinnedBottomRows}
      {...gridProps}
    />
  );
}
