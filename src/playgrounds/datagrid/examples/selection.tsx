import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type {
  OwpDataGridColumn,
  OwpDataGridRowId,
  OwpDataGridRowSelectionMode,
} from '@owp/datagrid/types';
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
  rows: initialTasks,
  columns: baseColumns,
  getRowId,
  rowSelectionMode: 'single',
  height: 420,
};

const selectionModes = [
  { value: 'single', label: '단일 선택 (라디오)' },
  { value: 'multiple', label: '다중 선택 (체크박스)' },
  { value: 'none', label: '선택 없음' },
] as const;

export function SelectionGrid(props: GridViewProps = {}) {
  const { gridRef, onRecord, onRowsChange, onBusyChange, onSelectionModeChange, ...gridProps } =
    props;
  const [model, setModel] = useState<readonly OwpDataGridRowId[]>([]);
  const [mode, setMode] = useState<OwpDataGridRowSelectionMode>('single');
  const currentMode = gridProps.rowSelectionMode ?? mode;
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <fieldset className="example-controls" aria-label={translate('행 선택 방식')}>
          <span>{translate('행 선택 방식')}</span>
          {selectionModes.map(({ value, label }) => (
            <Button
              key={value}
              variant={currentMode === value ? 'contained' : 'outlined'}
              aria-pressed={currentMode === value}
              onClick={() => {
                if (value === currentMode) return;
                setMode(value);
                onSelectionModeChange?.(value);
                setModel([]);
                gridProps.onRowSelectionModelChange?.([]);
                onRecord?.('rowSelectionMode', value);
              }}
            >
              {translate(label)}
            </Button>
          ))}
        </fieldset>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={initialTasks}
          columns={baseColumns}
          getRowId={getRowId}
          height="100%"
          {...gridProps}
          rowSelectionMode={currentMode}
          rowSelectionModel={gridProps.rowSelectionModel ?? model}
          onRowSelectionModelChange={(next) => {
            setModel(next);
            gridProps.onRowSelectionModelChange?.(next);
          }}
        />
      </div>
    </div>
  );
}
