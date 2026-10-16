import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridRef } from '@owp/datagrid/types';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getRowId, initialTasks, owners, statuses, type Task } from '../model/data';
import type { Definition, ExampleProps } from '../model/types';

const tagOptions = [
  { value: 'design', label: '디자인' },
  { value: 'web', label: '웹' },
  { value: 'mobile', label: '모바일' },
  { value: 'qa', label: '검증' },
] as const;

const columns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 150, relWidth: 1 },
  { id: 'task', field: 'task', header: '작업', minWidth: 180, relWidth: 1.4 },
  {
    id: 'tags',
    field: 'tags',
    header: '태그',
    minWidth: 140,
    relWidth: 0.9,
    type: 'select',
    editable: true,
    valueOptions: tagOptions,
  },
  {
    id: 'owner',
    field: 'owner',
    header: '담당자',
    minWidth: 100,
    relWidth: 0.7,
    type: 'select',
    editable: true,
    valueOptions: owners.map((value) => ({ value, label: value })),
  },
  {
    id: 'status',
    field: 'status',
    header: '상태',
    minWidth: 110,
    relWidth: 0.8,
    type: 'select',
    editable: true,
    valueOptions: statuses.map((value) => ({ value, label: value })),
  },
  {
    id: 'quantity',
    field: 'quantity',
    header: '계획',
    minWidth: 85,
    relWidth: 0.6,
    type: 'number',
    editable: true,
  },
  {
    id: 'completed',
    field: 'completed',
    header: '완료',
    minWidth: 85,
    relWidth: 0.6,
    type: 'number',
    editable: true,
  },
  {
    id: 'date',
    field: 'date',
    header: '마감일',
    minWidth: 150,
    relWidth: 1,
    type: 'date',
    editable: true,
    align: 'center',
    headerAlign: 'center',
    dateOptions: { format: 'YYYY-MM-DD' },
  },
] satisfies OwpDataGridColumn<Task>[];

export const exampleDefinition: Definition = {
  rows: initialTasks.map((row) => ({ ...row, tags: row.tags.split(',')[0] ?? '' })),
  columns,
  getRowId,
  rowSelectionMode: 'none',
  height: 420,
};

export function OwpDataGridExample(props: ExampleProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const { t } = useTranslation('app');
  const [multiple, setMultiple] = useState(false);
  const [autocomplete, setAutocomplete] = useState(
    () => new URLSearchParams(window.location.search).get('sample') === 'autocomplete',
  );
  const [error, setError] = useState('');
  const currentColumns = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        header: t(column.header),
        ...('valueOptions' in column && column.valueOptions
          ? {
              valueOptions: column.valueOptions.map((option) => ({
                ...option,
                label: t(option.label),
              })),
            }
          : {}),
        ...(column.id === 'tags'
          ? {
              valueOptions: tagOptions.map((option) => ({ ...option, label: t(option.label) })),
              selectOptions: autocomplete ? undefined : { multiple },
              autocompleteOptions: autocomplete ? { multiple } : undefined,
            }
          : {}),
      })),
    [multiple, autocomplete, t],
  );

  function changeEditor(next: boolean) {
    if (next === autocomplete) return;
    if (!gridRef.current?.commitEditing()) {
      setError('편집 중인 셀에 오류가 있습니다.');
      return;
    }
    setError('');
    setAutocomplete(next);
    onRecord?.('select.editor', { autocomplete: next });
  }

  function changeMode(next: boolean) {
    if (next === multiple) return;
    const grid = gridRef.current;
    if (!grid?.commitEditing()) {
      setError('편집 중인 셀에 오류가 있습니다.');
      return;
    }
    if (!next) {
      const result = grid.applyTransaction(
        grid
          .getRows()
          .filter((row) => row.tags.includes(','))
          .map((row) => ({
            type: 'setCellValue',
            rowId: row.id,
            columnId: 'tags',
            value: row.tags.split(',')[0] ?? '',
          })),
      );
      if (!result.success) {
        setError('선택 방식을 바꾸지 못했습니다.');
        onRecord?.('select.mode.error', result);
        return;
      }
    }
    setError('');
    setMultiple(next);
    onRecord?.('select.mode', { multiple: next });
  }

  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-option-rows">
        <fieldset className="example-controls example-option-row" aria-label={t('편집기')}>
          <span>{t('편집기')}</span>
          {([false, true] as const).map((value) => (
            <Button
              key={String(value)}
              variant={autocomplete === value ? 'contained' : 'outlined'}
              aria-pressed={autocomplete === value}
              onClick={() => changeEditor(value)}
            >
              {t(value ? '자동완성' : '셀렉트')}
            </Button>
          ))}
        </fieldset>
        <fieldset className="example-controls example-option-row" aria-label={t('선택 방식')}>
          <span>{t('선택 방식')}</span>
          {([false, true] as const).map((value) => (
            <Button
              key={String(value)}
              variant={multiple === value ? 'contained' : 'outlined'}
              aria-pressed={multiple === value}
              onClick={() => changeMode(value)}
            >
              {t(value ? '다중 선택' : '단일 선택')}
            </Button>
          ))}
        </fieldset>
      </div>
      <p className="example-caption">{t('단일 선택으로 바꾸면 첫 값만 남습니다.')}</p>
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
          columns={currentColumns}
        />
      </div>
    </div>
  );
}
