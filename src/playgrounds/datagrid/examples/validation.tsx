import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridValidationResult } from '@owp/datagrid/types';
import { useMemo, useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { createTaskValidationColumns, taskValidationConfiguration } from './configs/taskValidation';

export { taskValidationConfiguration as gridConfiguration } from './configs/taskValidation';

export function InputValidationGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const columns = useMemo(
    () => createTaskValidationColumns(t, gridProps.columns),
    [gridProps.columns, t],
  );
  const { onAction } = callbacks ?? {};
  const [validation, setValidation] = useState<OwpDataGridValidationResult<Task> | null>(null);
  const handleValidate = () => {
    gridApi.commitEditing();
    const value = gridApi.validate();
    setValidation(value ?? null);
    onAction?.('validate', value);
  };
  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskValidationConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button variant="outlined" onClick={handleValidate}>
            {t('입력 검증')}
          </Button>
        </div>
      </PreviewActions>
      {validation && (
        <output className="example-caption">
          {validation.valid
            ? t('입력값에 문제가 없습니다.')
            : t('입력값 {{count}}개에 오류가 있습니다.', {
                count: validation.errors.length,
              })}
        </output>
      )}
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
