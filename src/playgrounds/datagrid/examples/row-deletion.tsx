import { PreviewActions } from '../../../shared/ui/PreviewActions';
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
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { seedTask } from '../model/data';
export const gridConfiguration: GridConfiguration = {
  rows: initialTasks,
  columns: editableColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  rowDeletion: { showDeletedRows: true },
  rowAnimation: true,
  layout: { rowPanel: { allowAddedRowSelection: true } },
};

export function DeleteRestoreRowsGrid(props: GridViewProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const [deleted, setDeleted] = useState<readonly OwpDataGridRowId[]>([]);
  const publish = (api: string, value: unknown) => {
    onRecord?.(api, value);
  };
  const remove = () => {
    const ids = gridRef.current?.deleteRows(selected) ?? [];
    setDeleted(ids);
    publish('deleteRows', ids);
  };
  const restore = () => {
    publish('undeleteRows', gridRef.current?.undeleteRows(deleted));
    setDeleted([]);
  };
  const discard = () => {
    const added =
      gridRef.current
        ?.getChanges()
        .filter((change) => change.type === 'added')
        .map((change) => change.rowId) ?? [];
    publish('discardAddedRows', gridRef.current?.discardAddedRows(added));
  };
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <Button
            onClick={() =>
              publish(
                'addRow',
                gridRef.current?.addRow(
                  {
                    ...seedTask,
                    id: crypto.randomUUID(),
                    task: translate('새 작업'),
                  },
                  { position: 'root-first' },
                ),
              )
            }
          >
            {translate('새 행 추가')}
          </Button>
          <Button disabled={selected.length === 0} onClick={remove}>
            {translate('선택 행 삭제')}
          </Button>
          <Button disabled={deleted.length === 0} onClick={restore}>
            {translate('삭제 복구')}
          </Button>
          <Button onClick={discard}>{translate('새 행 추가 취소')}</Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={initialTasks}
          columns={editableColumns}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          height="100%"
          rowDeletion={gridConfiguration.rowDeletion}
          rowAnimation={gridConfiguration.rowAnimation}
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
