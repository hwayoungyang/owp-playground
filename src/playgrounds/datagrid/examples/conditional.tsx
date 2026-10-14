import { FormControlLabel, MenuItem, Select, Switch } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, owners, statuses } from '../model/data';
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

export const exampleDefinition: Definition = {
  rows: initialTasks,
  columns: editableColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
};

const backgroundScopeSchema = z.enum(['cell', 'row']);

export function OwpDataGridExample(props: ExampleProps = {}) {
  const { t } = useTranslation('app');
  const { gridRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [backgroundScope, setBackgroundScope] = useState<'cell' | 'row'>(() =>
    new URLSearchParams(window.location.search).get('sample') === 'row-background' ? 'row' : 'cell',
  );
  const [restrictCompleted, setRestrictCompleted] = useState(true);
  const columns = useMemo(
    () =>
      (gridProps.columns ?? editableColumns).map<OwpDataGridColumn<Task>>((column) => ({
        ...column,
        cellStyle: ({ row }) => {
          if (backgroundScope === 'cell') {
            if (column.id !== 'completed') return {};
            return row.completed === row.quantity
              ? { backgroundColor: 'var(--pg-blue-wash)', color: 'var(--pg-blue)' }
              : { backgroundColor: 'var(--pg-purple-wash)', color: 'var(--pg-purple)' };
          }
          if (row.status === '완료') {
            return { backgroundColor: 'var(--pg-blue-wash)', color: 'var(--pg-blue)' };
          }
          return row.status === '검토 중'
            ? { backgroundColor: 'var(--pg-purple-wash)', color: 'var(--pg-purple)' }
            : {};
        },
        editable: (params) =>
          (!restrictCompleted || params.row.status !== '완료') &&
          (typeof column.editable === 'function'
            ? column.editable(params)
            : Boolean(column.editable)),
      })),
    [gridProps.columns, backgroundScope, restrictCompleted],
  );
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <span>{t('배경색 적용')}</span>
        <Select
          size="small"
          value={backgroundScope}
          inputProps={{ 'aria-label': t('배경색 적용') }}
          onChange={(event) => setBackgroundScope(backgroundScopeSchema.parse(event.target.value))}
        >
          <MenuItem value="cell">{t('셀')}</MenuItem>
          <MenuItem value="row">{t('행')}</MenuItem>
        </Select>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={restrictCompleted}
              onChange={(_, checked) => setRestrictCompleted(checked)}
            />
          }
          label={t('완료 행 편집 제한')}
        />
      </div>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={initialTasks}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          style={{ height: '100%' }}
          {...gridProps}
          columns={columns}
        />
      </div>
    </div>
  );
}
