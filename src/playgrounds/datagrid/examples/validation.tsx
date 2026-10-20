import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridValidationResult } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskValidationConfiguration } from './configs/taskValidation';

export { taskValidationConfiguration as gridConfiguration } from './configs/taskValidation';

export function InputValidationGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [validation, setValidation] = useState<OwpDataGridValidationResult<Task> | null>(null);
  const handleValidate = () => {
    gridRef.current?.commitEditing();
    const value = gridRef.current?.validate();
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
            {translate('입력 검증')}
          </Button>
        </div>
      </PreviewActions>
      {validation && (
        <output className="example-caption">
          {validation.valid
            ? translate('입력값에 문제가 없습니다.')
            : translate('입력값 {{count}}개에 오류가 있습니다.', {
                count: validation.errors.length,
              })}
        </output>
      )}
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={taskValidationConfiguration.rows}
          columns={taskValidationConfiguration.columns}
          getRowId={taskValidationConfiguration.getRowId}
          rowSelectionMode={taskValidationConfiguration.rowSelectionMode}
          {...gridProps}
          height="100%"
        />
      </div>
    </div>
  );
}
