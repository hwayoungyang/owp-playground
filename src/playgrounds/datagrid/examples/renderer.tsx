import { Button, Chip, LinearProgress, Switch } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridRef } from '@owp/datagrid/types';
import { CheckIcon } from '@phosphor-icons/react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translate } from '../../../shared/i18n/translate';
import { getRowId, initialTasks, type Task } from '../model/data';
import type { Definition, ExampleProps } from '../model/types';

function createColumns(actions?: {
  readonly complete: (row: Task) => void;
  readonly toggle: (row: Task, checked: boolean) => void;
}): OwpDataGridColumn<Task>[] {
  return [
    { id: 'project', field: 'project', header: translate('프로젝트'), minWidth: 150, relWidth: 1 },
    { id: 'task', field: 'task', header: translate('작업'), minWidth: 180, relWidth: 1.3 },
    {
      id: 'status',
      field: 'status',
      header: translate('상태'),
      minWidth: 140,
      relWidth: 0.8,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <Chip
          label={translate(row.status)}
          sx={{
            color: row.status === '검토 중' ? 'var(--pg-warning)' : 'var(--pg-success)',
            bgcolor: row.status === '검토 중' ? 'var(--pg-warning-wash)' : 'var(--pg-success-wash)',
            ...(row.status === '대기'
              ? { color: 'var(--pg-secondary)', bgcolor: 'var(--pg-subtle)' }
              : {}),
          }}
        />
      ),
      excel: { valueGetter: ({ row }) => translate(row.status) },
    },
    {
      id: 'progress',
      field: 'completed',
      header: translate('진행률'),
      minWidth: 160,
      relWidth: 1,
      type: 'number',
      valueGetter: (row) =>
        row.quantity > 0 ? Math.round((row.completed / row.quantity) * 100) : 0,
      valueSetter: ({ row, nextValue }) =>
        typeof nextValue === 'number'
          ? {
              ...row,
              completed: Math.round((row.quantity * Math.max(0, Math.min(100, nextValue))) / 100),
            }
          : row,
      renderCell: ({ row, value }) => {
        const percent = typeof value === 'number' ? Math.max(0, Math.min(100, value)) : 0;
        return (
          <div className="progress-cell">
            <LinearProgress
              variant="determinate"
              value={percent}
              aria-label={`${row.task} ${translate('진행률')}`}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                bgcolor: 'var(--pg-subtle)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'var(--pg-success)',
                  transition: 'none',
                },
              }}
            />
            <span>{percent}%</span>
          </div>
        );
      },
      excel: { numFmt: '0"%"' },
    },
    {
      id: 'active',
      field: 'active',
      header: translate('알림'),
      minWidth: 100,
      relWidth: 0.6,
      align: 'center',
      headerAlign: 'center',
      type: 'boolean',
      renderCell: ({ row }) => (
        <Switch
          size="small"
          checked={row.active}
          slotProps={{ input: { 'aria-label': translate('{{task}} 알림', { task: row.task }) } }}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(_, checked) => actions?.toggle(row, checked)}
          disabled={!actions}
        />
      ),
      excel: { valueGetter: ({ row }) => translate(row.active ? '켜짐' : '꺼짐') },
    },
    {
      id: 'action',
      header: translate('완료 처리'),
      minWidth: 140,
      relWidth: 0.9,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Button
          variant="outlined"
          startIcon={<CheckIcon size={16} />}
          disabled={!actions || row.status === '완료'}
          aria-label={translate('{{task}} 완료 처리', { task: row.task })}
          onKeyDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            actions?.complete(row);
          }}
        >
          {translate(row.status === '완료' ? '완료됨' : '완료 처리')}
        </Button>
      ),
      excel: false,
    },
  ];
}

export const exampleDefinition: Definition = {
  rows: initialTasks,
  columns: createColumns(),
  getRowId,
  rowSelectionMode: 'none',
  height: 420,
};

export function OwpDataGridExample(props: ExampleProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const { t } = useTranslation('app');
  const [error, setError] = useState('');
  const columns = useMemo(
    () =>
      createColumns({
        complete: (row) => {
          const grid = gridRef.current;
          if (!grid?.commitEditing()) {
            setError('편집 중인 셀에 오류가 있습니다.');
            return;
          }
          const result = grid.applyTransaction([
            { type: 'setCellValue', rowId: row.id, columnId: 'status', value: '완료' },
            { type: 'setCellValue', rowId: row.id, columnId: 'progress', value: 100 },
          ]);
          setError(result.success ? '' : '변경을 적용하지 못했습니다.');
          onRecord?.('cell.complete', { rowId: row.id, result });
        },
        toggle: (row, checked) => {
          const grid = gridRef.current;
          const success = Boolean(
            grid?.commitEditing() && grid.setCellValue(row.id, 'active', checked),
          );
          setError(success ? '' : '변경을 적용하지 못했습니다.');
          onRecord?.('cell.notifications', { rowId: row.id, checked, success });
        },
      }).map((column) => ({ ...column, header: t(String(column.header)) })),
    [gridRef, onRecord, t],
  );

  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <p className="example-caption">{t('버튼·스위치의 속성과 이벤트를 설정합니다.')}</p>
      {error && (
        <output className="example-caption" role="alert">
          {t(error)}
        </output>
      )}
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={exampleDefinition.rows}
          getRowId={getRowId}
          rowSelectionMode="none"
          style={{ height: '100%' }}
          {...gridProps}
          columns={columns}
        />
      </div>
    </div>
  );
}
