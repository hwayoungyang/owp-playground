import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { useMemo, useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { useExampleFeedback } from '../../../shared/ui/useExampleFeedback';
import type { Task, TaskGridProps } from '../types';
import {
  createTaskValidationColumns,
  taskValidationConfiguration,
  type TaskValidationOptions,
} from './configs/taskValidation';

export { taskValidationConfiguration as gridConfiguration } from './configs/taskValidation';

type ValidationMode = NonNullable<TaskValidationOptions['validationMode']>;

export function InputValidationGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const [validationMode, setValidationMode] = useState<ValidationMode>('onCommit');
  const [clearErrorOnInput, setClearErrorOnInput] = useState(false);
  const columns = useMemo(
    () => createTaskValidationColumns(t, gridProps.columns, { validationMode, clearErrorOnInput }),
    [gridProps.columns, t, validationMode, clearErrorOnInput],
  );
  const { onAction } = callbacks ?? {};
  const { notify, dismiss, feedback } = useExampleFeedback();

  const commitCurrentEdit = (action: string) => {
    dismiss();
    const committed = gridApi.commitEditing();
    if (!committed) {
      notify(t('편집을 확정하지 못했습니다. 입력을 마친 뒤 다시 시도해 주세요.'), 'error');
    }
    onAction?.('commitEditing', { action, committed });
    return committed;
  };

  const handleValidationModeChange = (next: ValidationMode) => {
    if (next === validationMode) return;
    const committed = commitCurrentEdit('validationMode');
    onAction?.('validationMode', { requested: next, applied: committed });
    if (!committed) return;
    setValidationMode(next);
  };

  const handleClearErrorOnInputChange = (next: boolean) => {
    if (next === clearErrorOnInput) return;
    const committed = commitCurrentEdit('clearErrorOnInput');
    onAction?.('clearErrorOnInput', { requested: next, applied: committed });
    if (!committed) return;
    setClearErrorOnInput(next);
  };

  const handleValidate = () => {
    if (!commitCurrentEdit('validate')) return;
    const result = gridApi.validate();
    onAction?.('validate', result);
    notify(
      result.valid
        ? t('검사를 통과했습니다.')
        : t('검사 결과: 오류 {{count}}건', { count: result.errors.length }),
      result.valid ? 'success' : 'warning',
    );
  };

  const handleSetExternalErrors = () => {
    const applied = gridApi.setCellErrors([
      { rowId: 'task-1', columnId: 'task', message: t('작업명이 올바르지 않습니다.') },
      { rowId: 'task-2', columnId: 'completed', message: t('완료 수량이 올바르지 않습니다.') },
      { rowId: 'task-1', columnId: 'status', message: t('서버에서 상태를 확인하지 못했습니다.') },
      { rowId: 'task-1', columnId: 'date', message: t('서버에서 마감일을 확인하지 못했습니다.') },
    ]);
    onAction?.('setCellErrors', applied);
    notify(
      t(
        applied
          ? '작업명·완료 수량·상태·마감일에 외부 오류를 표시했습니다.'
          : '외부 오류를 표시하지 못했습니다. 대상 행과 컬럼이 있는지 확인해 주세요.',
      ),
      applied ? 'info' : 'error',
    );
  };

  const handleClearExternalErrors = () => {
    gridApi.clearCellErrors();
    onAction?.('clearCellErrors', { cleared: true, source: 'external' });
    notify(t('외부 오류를 모두 해제했습니다. intrinsic 검증 오류는 유지됩니다.'), 'success');
  };
  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskValidationConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-settings-toolbar example-settings-toolbar--validation">
          <div className="example-settings-fields example-settings-fields--validation">
            <p className="example-setting-help example-setting-help--wide">
              {t(
                '셀 값을 바꾸며 검사 시점과 오류 처리 방식을 비교해 보세요. 외부 오류를 표시한 뒤 수정하면 차이를 확인할 수 있습니다.',
              )}
            </p>
            <fieldset className="example-setting-field" aria-label={t('검사 시점')}>
              <span className="example-setting-label">{t('검사 시점')}</span>
              <div className="example-setting-buttons">
                {(['onCommit', 'manual'] as const).map((value) => (
                  <Button
                    key={value}
                    variant={validationMode === value ? 'contained' : 'outlined'}
                    aria-pressed={validationMode === value}
                    onClick={() => handleValidationModeChange(value)}
                  >
                    {t(value === 'onCommit' ? '값 확정 시' : '직접 검사')}
                  </Button>
                ))}
              </div>
            </fieldset>
            <fieldset className="example-setting-field" aria-label={t('오류 처리')}>
              <span className="example-setting-label">{t('오류 처리')}</span>
              <div className="example-setting-buttons">
                {([false, true] as const).map((value) => (
                  <Button
                    key={String(value)}
                    variant={clearErrorOnInput === value ? 'contained' : 'outlined'}
                    aria-pressed={clearErrorOnInput === value}
                    onClick={() => handleClearErrorOnInputChange(value)}
                  >
                    {t(value ? '수정 시 해제' : '오류 유지')}
                  </Button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="example-settings-actions">
            <Button variant="outlined" onClick={handleValidate}>
              {t('입력 검증')}
            </Button>
            <Button variant="outlined" onClick={handleSetExternalErrors}>
              {t('외부 오류 표시')}
            </Button>
            <Button variant="outlined" onClick={handleClearExternalErrors}>
              {t('외부 오류 모두 해제')}
            </Button>
          </div>
        </div>
      </PreviewActions>
      {feedback}
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskValidationConfiguration.rows}
          getRowId={taskValidationConfiguration.getRowId}
          rowSelectionMode={taskValidationConfiguration.rowSelectionMode}
          {...gridProps}
          columns={columns}
          height="100%"
        />
      </div>
    </div>
  );
}
