import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, statuses } from '../model/data';
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

export const exampleDefinition: Definition = {
  rows: initialTasks,
  columns: baseColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  rowDeletion: true,
};

export function OwpDataGridExample(props: ExampleProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const select = (next: readonly OwpDataGridRowId[]) => {
    setSelection(next);
    gridProps.onRowSelectionModelChange?.([...next]);
  };
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <Button
          variant="outlined"
          onClick={() => {
            const row = gridRef.current?.getRows()[0];
            if (row) select([row.id]);
          }}
        >
          {translate('첫 행 선택')}
        </Button>
        <Button variant="outlined" onClick={() => select([])}>
          {translate('선택 해제')}
        </Button>
        <Button
          variant="outlined"
          disabled={selected.length === 0}
          onClick={() => {
            const ids = gridRef.current?.deleteRows(selected);
            onRecord?.('deleteRows', ids);
            select([]);
          }}
        >
          {translate('행 삭제')}
        </Button>
        <span className="status-badge status-1">
          <span className="status-dot" />
          {translate('완료')}
        </span>
        <span className="status-badge status-2">
          <span className="status-dot" />
          {translate('검토 중')}
        </span>
      </div>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={initialTasks}
          columns={baseColumns}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          rowDeletion={true}
          {...gridProps}
          style={{ height: '100%' }}
          rowSelectionModel={selected}
          onRowSelectionModelChange={select}
        />
      </div>
    </div>
  );
}
