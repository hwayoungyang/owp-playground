import { OwpDataGrid } from '@owp/datagrid';
import type {
  OwpDataGridColumn,
  OwpDataGridFilterItem,
  OwpDataGridSortItem,
} from '@owp/datagrid/types';
import { useEffect, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, owners, statuses } from '../model/data';
import { queryTasks } from '../model/server';
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

const editableColumns = baseColumns.map((column) => ({
  ...column,
  resizable: true,
  headerAlign: ['status', 'date', 'time', 'datetime'].includes(column.id)
    ? ('center' as const)
    : ('left' as const),
  editable: column.id !== 'project',
  ...(column.id === 'owner'
    ? { type: 'select' as const, valueOptions: owners.map((value) => ({ value, label: value })) }
    : {}),
}));

export const exampleDefinition: Definition = {
  rows: initialTasks,
  columns: editableColumns.map((column) => ({ ...column, editable: false })),
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  sortingMode: 'manual',
  filteringMode: 'manual',
  layout: { filterRow: true },
};
export function OwpDataGridExample(props: ExampleProps = {}) {
  const { gridRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [rows, setRows] = useState<readonly Task[]>(initialTasks);
  const [sort, setSort] = useState<readonly OwpDataGridSortItem[]>([]);
  const [filters, setFilters] = useState<readonly OwpDataGridFilterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const sortModel = gridProps.sortModel ?? sort;
  const filterModel = gridProps.filterModel ?? filters;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    onBusyChange?.(true);
    onRecord?.('request', { sort: sortModel, filters: filterModel, retry: revision });
    void queryTasks(sortModel, filterModel, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        setRows(next);
        onRowsChange?.(next);
        onRecord?.('response', { count: next.length });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (reason instanceof Error) setError(reason.message);
        else throw reason;
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          onBusyChange?.(false);
        }
      });
    return () => controller.abort();
  }, [sortModel, filterModel, onRecord, onRowsChange, onBusyChange, revision]);
  return (
    <OwpDataGrid
      ref={gridRef}
      getRowId={getRowId}
      height={420}
      rowSelectionMode="multiple"
      columns={exampleDefinition.columns}
      sortingMode="manual"
      filteringMode="manual"
      layout={{ filterRow: true }}
      {...gridProps}
      rows={rows}
      loading={loading}
      errorOverlay={
        error
          ? {
              message: error,
              onRetry: () => setRevision((value) => value + 1),
              retryLabel: translate('다시 불러오기'),
            }
          : undefined
      }
      sortModel={sortModel}
      onSortModelChange={(next) => {
        setSort(next);
        gridProps.onSortModelChange?.(next);
      }}
      filterModel={filterModel}
      onFilterModelChange={(next) => {
        setFilters(next);
        gridProps.onFilterModelChange?.(next);
      }}
    />
  );
}
