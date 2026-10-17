import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, owners, statuses } from '../model/data';
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

import { Button } from '@mui/material';
import type {
  OwpDataGridRef,
  OwpDataGridRowId,
  OwpDataGridRowPlacement,
} from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { seedTask } from '../model/data';
export const gridConfiguration: GridConfiguration = {
  rows: initialTasks,
  columns: editableColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  rowDeletion: true,
  layout: { rowPanel: { allowAddedRowSelection: true } },
};

export function RowInsertionGrid(props: GridViewProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;

  const publish = (api: string, value: unknown) => {
    onRecord?.(api, value);
  };
  const add = (placement: OwpDataGridRowPlacement, label: string) => {
    const row = { ...seedTask, id: crypto.randomUUID(), task: translate(label) };
    publish('addRow', {
      success: gridRef.current?.addRow(row, placement),
      rowId: row.id,
      placement,
    });
  };
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <Button onClick={() => add({ position: 'root-first' }, '상단에 추가')}>
          {translate('상단에 추가')}
        </Button>
        <Button
          disabled={selected.length !== 1}
          onClick={() => {
            const id = selected[0];
            if (id !== undefined)
              add({ position: 'after', targetRowId: id }, '선택 행 다음에 추가');
          }}
        >
          {translate('선택 행 다음에 추가')}
        </Button>
        <Button onClick={() => add({ position: 'root-last' }, '하단에 추가')}>
          {translate('하단에 추가')}
        </Button>
      </div>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={initialTasks}
          columns={editableColumns}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          height="100%"
          rowDeletion={gridConfiguration.rowDeletion}
          layout={gridConfiguration.layout}
          {...gridProps}
          rowSelectionModel={selected}
          onRowSelectionModelChange={(next) => {
            setSelection(next);
            gridProps.onRowSelectionModelChange?.(next);
          }}
        />
      </div>
    </div>
  );
}
