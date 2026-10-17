import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useEffect, useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { createTasks, getRowId, owners, statuses } from '../model/data';
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
  rows: createTasks(10000),
  columns: editableColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  virtualization: { rowHeight: 36 },
};
export function ExcelSnapshotGrid(props: GridViewProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const publish = (api: string, value: unknown) => {
    onRecord?.(api, value);
  };
  const request = useRef<AbortController | null>(null);
  const [reading, setReading] = useState(false);
  useEffect(() => () => request.current?.abort(), []);
  const readBatches = async () => {
    const controller = new AbortController();
    request.current = controller;
    setReading(true);
    try {
      const session = await gridRef.current?.createExcelExportSession?.({
        scope: 'all',
        signal: controller.signal,
      });
      if (!session) return;
      let count = 0;
      let batches = 0;
      while (!controller.signal.aborted) {
        const rows = await session.readRows();
        if (rows.length === 0) break;
        count += rows.length;
        batches += 1;
      }
      if (!controller.signal.aborted)
        publish('createExcelExportSession', {
          count,
          batches,
          summaryRows: await session.getSummaryRows(),
        });
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (error instanceof Error) publish('excel.error', { message: error.message });
      else throw error;
    } finally {
      if (!controller.signal.aborted) setReading(false);
    }
  };
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <Button
          onClick={() => {
            const snapshot = gridRef.current?.getExcelSnapshot({ scope: 'visible' });
            publish('getExcelSnapshot', {
              scope: snapshot?.scope,
              columns: snapshot?.columns,
              count: snapshot?.rows.length,
              firstRow: snapshot?.rows[0],
            });
          }}
        >
          {translate('데이터 미리보기')}
        </Button>
        <Button
          onClick={() =>
            publish('getExcelExportWarnings', gridRef.current?.getExcelExportWarnings?.())
          }
        >
          {translate('제외 항목 확인')}
        </Button>
        <Button disabled={reading} onClick={() => void readBatches()}>
          {translate('1만 행 읽기')}
        </Button>
        {reading && (
          <Button
            onClick={() => {
              request.current?.abort();
              setReading(false);
              publish('excel.cancel', { cancelled: true });
            }}
          >
            {translate('취소')}
          </Button>
        )}
      </div>
      <p className="example-caption">{translate('결과는 이벤트에서 확인합니다.')}</p>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={gridConfiguration.rows}
          columns={editableColumns}
          getRowId={getRowId}
          height="100%"
          rowSelectionMode="multiple"
          virtualization={{ rowHeight: 36 }}
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
