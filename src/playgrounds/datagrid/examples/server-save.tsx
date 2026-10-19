import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useEffect, useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, owners, seedTask, statuses } from '../model/data';
import type { GridConfiguration, GridViewProps } from '../model/gridTypes';
import { saveTasks } from '../model/server';

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
  rowSelectionMode: 'multiple',
  height: 420,
  rowDeletion: true,
  layout: { rowPanel: { allowAddedRowSelection: true } },
};
export function ServerSaveGrid(props: GridViewProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const publish = (api: string, value: unknown) => {
    onRecord?.(api, value);
  };
  const request = useRef<AbortController | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => () => request.current?.abort(), []);
  const save = async () => {
    const api = gridRef.current;
    if (!api?.commitEditing()) {
      publish('commitEditing', false);
      return;
    }
    const validation = api.validate();
    if (!validation.valid) {
      publish('validate', validation);
      return;
    }
    const submitted = api.getRows();
    const deletedRowIds = api
      .getChanges()
      .filter((change) => change.type === 'deleted')
      .map((change) => change.rowId);
    const controller = new AbortController();
    request.current = controller;
    setSaving(true);
    onRecord?.('request.save', { rowIds: submitted.map((row) => row.id), deletedRowIds });
    try {
      const saved = await saveTasks(submitted, controller.signal);
      if (controller.signal.aborted) return;
      const result = gridRef.current?.applyServerRows({
        rows: saved.map((row) => ({
          rowId: row.id,
          row,
          submittedRow: submitted.find((item) => item.id === row.id),
        })),
        deletedRowIds,
      });
      publish('applyServerRows', result);
    } finally {
      if (!controller.signal.aborted) setSaving(false);
    }
  };
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <Button disabled={saving} onClick={() => void save()}>
            {translate('모의 저장')}
          </Button>
          <Button
            onClick={() =>
              publish(
                'addRow',
                gridRef.current?.addRow({
                  ...seedTask,
                  id: crypto.randomUUID(),
                  task: translate('새 작업'),
                }),
              )
            }
          >
            {translate('새 행 추가')}
          </Button>
          <Button
            disabled={selected.length === 0}
            onClick={() => publish('deleteRows', gridRef.current?.deleteRows(selected))}
          >
            {translate('선택 행 삭제')}
          </Button>
          {saving && (
            <>
              <span>{translate('저장 중에도 셀을 편집할 수 있습니다.')}</span>
              <Button
                onClick={() => {
                  request.current?.abort();
                  setSaving(false);
                  publish('save.cancel', { cancelled: true });
                }}
              >
                {translate('취소')}
              </Button>
            </>
          )}
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={gridConfiguration.rows}
          columns={editableColumns}
          getRowId={getRowId}
          height="100%"
          rowSelectionMode="multiple"
          rowDeletion={true}
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
