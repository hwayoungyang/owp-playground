import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, statuses } from '../model/data';
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

export const gridConfiguration: GridConfiguration = {
  rows: [],
  columns: baseColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  errorOverlay: { message: '작업 목록을 불러오지 못했습니다.' },
};

export function RetryStateGrid(props: GridViewProps = {}) {
  const { gridRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [rows, setRows] = useState<readonly Task[]>([]);
  const [failed, setFailed] = useState(true);
  const retry = () => {
    setRows(initialTasks);
    setFailed(false);
    onRowsChange?.(initialTasks);
    const overlay = gridProps.errorOverlay;
    if (
      overlay &&
      typeof overlay === 'object' &&
      'onRetry' in overlay &&
      typeof overlay.onRetry === 'function'
    )
      overlay.onRetry();
    else onRecord?.('retry', { count: initialTasks.length });
  };
  return (
    <OwpDataGrid
      ref={gridRef}
      columns={baseColumns}
      getRowId={getRowId}
      rowSelectionMode="multiple"
      height={420}
      {...gridProps}
      rows={gridProps.rows ?? rows}
      errorOverlay={
        failed
          ? {
              message: translate('작업 목록을 불러오지 못했습니다.'),
              retryLabel: translate('다시 불러오기'),
              onRetry: retry,
            }
          : undefined
      }
    />
  );
}
