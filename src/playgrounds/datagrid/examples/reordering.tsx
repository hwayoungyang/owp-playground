import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type {
  OwpDataGridColumn,
  OwpDataGridRef,
  OwpDataGridRowDragMode,
} from '@owp/datagrid/types';
import { useRef, useState } from 'react';
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
  rows: initialTasks,
  columns: baseColumns.map((column) => ({ ...column, sortable: false, filterable: false })),
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  rowReordering: { dragMode: 'selected' },
};

export function DraggableRowsGrid(props: GridViewProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const [mode, setMode] = useState<OwpDataGridRowDragMode>('selected');
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <fieldset className="example-controls" aria-label={translate('드래그 대상')}>
        {(['single', 'selected'] as const).map((value) => (
          <Button
            key={value}
            variant={mode === value ? 'contained' : 'outlined'}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            {translate(value === 'single' ? '한 행' : '선택한 행')}
          </Button>
        ))}
      </fieldset>
      <p className="example-caption">{translate('선택한 행은 함께 이동합니다.')}</p>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={gridConfiguration.rows}
          columns={gridConfiguration.columns}
          getRowId={gridConfiguration.getRowId}
          rowSelectionMode={gridConfiguration.rowSelectionMode}
          height={gridConfiguration.height}
          {...gridProps}
          rowReordering={{
            dragMode: mode,
            onRowsMove: ({ rowIds, targetRowId, placement }) => {
              onRecord?.('rows.drag', { rowIds, targetRowId, placement });
              onRowsChange?.(gridRef.current?.getRows() ?? []);
            },
          }}
        />
      </div>
    </div>
  );
}
