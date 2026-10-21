import './styles.css';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { useOwpTranslation } from '@owp/components/hooks';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { useMemo, useState } from 'react';
import { getRowId } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import {
  selectEditorsTagOptions,
  selectEditorsColumns,
  selectEditorsConfiguration,
} from './configs/selectEditors';

export { selectEditorsConfiguration as gridConfiguration } from './configs/selectEditors';

export function SelectEditorsGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const { t } = useOwpTranslation();
  const [multiple, setMultiple] = useState(false);
  const [autocomplete, setAutocomplete] = useState(
    () => new URLSearchParams(window.location.search).get('sample') === 'autocomplete',
  );
  const [error, setError] = useState('');
  const currentColumns = useMemo(
    () =>
      selectEditorsColumns.map((column) => ({
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
              valueOptions: selectEditorsTagOptions.map((option) => ({
                ...option,
                label: t(option.label),
              })),
              selectOptions: autocomplete ? undefined : { multiple },
              autocompleteOptions: autocomplete ? { multiple } : undefined,
            }
          : {}),
      })),
    [multiple, autocomplete, t],
  );

  function handleEditorChange(next: boolean) {
    if (next === autocomplete) return;
    if (!gridApi.commitEditing()) {
      setError('편집 중인 셀에 오류가 있습니다.');
      return;
    }
    setError('');
    setAutocomplete(next);
    onAction?.('select.editor', { autocomplete: next });
  }

  function handleModeChange(next: boolean) {
    if (next === multiple) return;
    const grid = gridApi;
    if (!grid.commitEditing()) {
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
        onAction?.('select.mode.error', result);
        return;
      }
    }
    setError('');
    setMultiple(next);
    onAction?.('select.mode', { multiple: next });
  }

  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-option-rows">
          <fieldset className="example-controls example-option-row" aria-label={t('편집기')}>
            <span>{t('편집기')}</span>
            {([false, true] as const).map((value) => (
              <Button
                key={String(value)}
                variant={autocomplete === value ? 'contained' : 'outlined'}
                aria-pressed={autocomplete === value}
                onClick={() => handleEditorChange(value)}
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
                onClick={() => handleModeChange(value)}
              >
                {t(value ? '다중 선택' : '단일 선택')}
              </Button>
            ))}
          </fieldset>
        </div>
      </PreviewActions>
      <p className="example-caption">{t('단일 선택으로 바꾸면 첫 번째 값만 남습니다.')}</p>
      {error && (
        <output className="example-caption" role="alert">
          {t(error)}
        </output>
      )}
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={selectEditorsConfiguration.rows}
          getRowId={getRowId}
          rowSelectionMode="none"
          height="100%"
          {...gridProps}
          columns={currentColumns}
        />
      </div>
    </div>
  );
}
