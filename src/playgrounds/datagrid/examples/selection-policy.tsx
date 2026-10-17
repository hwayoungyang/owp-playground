import { Button, FormControlLabel, Switch } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridRef } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
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
  allowSelectAll: false,
  defaultRowSelectionModel: ['task-1'],
  rowDeletion: true,
  layout: {
    rowPanel: {
      selectionControl: true,
      allowAddedRowSelection: true,
      deleteAction: true,
      deleteActionScope: 'added',
    },
  },
};
export function NewRowSelectionGrid(props: GridViewProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [allowAddedSelection, setAllowAddedSelection] = useState(true);
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <Button
          onClick={() => {
            const row = { ...seedTask, id: crypto.randomUUID(), task: translate('새 작업') };
            const success = gridRef.current?.addRow(row, { position: 'root-first' });
            onRecord?.('addRow', { success, rowId: row.id });
          }}
        >
          {translate('새 행 추가')}
        </Button>
        <FormControlLabel
          label={translate('새 행 체크박스 표시')}
          control={
            <Switch
              size="small"
              checked={allowAddedSelection}
              onChange={(_, checked) => {
                setAllowAddedSelection(checked);
                if (!checked) {
                  const added = new Set(
                    gridRef.current
                      ?.getChanges()
                      .filter((change) => change.type === 'added')
                      .map((change) => change.rowId),
                  );
                  gridProps.onRowSelectionModelChange?.(
                    (gridProps.rowSelectionModel ?? []).filter((id) => !added.has(id)),
                  );
                }
                onRecord?.('allowAddedRowSelection', checked);
              }}
            />
          }
        />
      </div>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={initialTasks}
          columns={editableColumns}
          getRowId={getRowId}
          height="100%"
          rowSelectionMode="multiple"
          allowSelectAll={false}
          defaultRowSelectionModel={['task-1']}
          rowDeletion={true}
          {...gridProps}
          layout={{
            ...gridProps.layout,
            rowPanel: {
              selectionControl: true,
              allowAddedRowSelection: allowAddedSelection,
              deleteAction: true,
              deleteActionScope: 'added',
            },
          }}
        />
      </div>
    </div>
  );
}
