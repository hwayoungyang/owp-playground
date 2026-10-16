import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type {
  OwpDataGridColumn,
  OwpDataGridRef,
  OwpDataGridValidationResult,
} from '@owp/datagrid/types';
import { useRef, useState } from 'react';
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
  headerAlign: ['status', 'date', 'time', 'datetime'].includes(column.id)
    ? ('center' as const)
    : ('left' as const),
  editable: column.id !== 'project',
  ...(column.id === 'owner'
    ? { type: 'select' as const, valueOptions: owners.map((value) => ({ value, label: value })) }
    : {}),
}));

export const gridConfiguration: GridConfiguration = {
  rows: initialTasks,
  columns: editableColumns.map((column) => ({
    ...column,
    required: column.id === 'task',
    ...(column.id === 'completed'
      ? {
          numberOptions: { min: 0, allowNegative: false },
          validate: ({ row, value }) =>
            Number(value) > row.quantity
              ? translate('완료 수량은 계획 수량을 넘을 수 없습니다.')
              : null,
        }
      : {}),
  })),
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
};

export function InputValidationGrid(props: GridViewProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [validation, setValidation] = useState<OwpDataGridValidationResult<Task> | null>(null);
  const validate = () => {
    gridRef.current?.commitEditing();
    const value = gridRef.current?.validate();
    setValidation(value ?? null);
    onRecord?.('validate', value);
  };
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <Button variant="outlined" onClick={validate}>
          {translate('입력 검증')}
        </Button>
        {validation && (
          <span role="status">
            {validation.valid
              ? translate('입력값에 문제가 없습니다.')
              : translate('{{count}}개 입력값에 오류가 있습니다.', {
                  count: validation.errors.length,
                })}
          </span>
        )}
      </div>

      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={gridConfiguration.rows}
          columns={gridConfiguration.columns}
          getRowId={gridConfiguration.getRowId}
          rowSelectionMode={gridConfiguration.rowSelectionMode}
          {...gridProps}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
