import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId } from '@owp/datagrid/types';
import { useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { useExampleFeedback } from '../../../shared/ui/useExampleFeedback';
import type { Task, TaskGridProps } from '../types';
import { taskExternalValidationConfiguration } from './configs/taskExternalValidation';

export { taskExternalValidationConfiguration as gridConfiguration } from './configs/taskExternalValidation';

export function ValidationMessagesGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const { notify, feedback } = useExampleFeedback();

  const publish = (api: string, value: unknown) => {
    onAction?.(api, value);
    const count = gridApi.getCellErrors().length;
    notify(
      t(
        count === 0
          ? '표시된 검증 메시지가 없습니다.'
          : '검증 메시지 {{count}}건이 표시되어 있습니다.',
        { count },
      ),
    );
  };

  const handleClearValidationMessages = () => {
    gridApi.clearCellErrors();
    onAction?.('clearCellErrors', { cleared: true });
    const count = gridApi.getCellErrors().length;
    notify(
      t(
        count === 0
          ? '검증 메시지를 모두 지웠습니다.'
          : '검증 메시지 {{count}}건이 표시되어 있습니다.',
        { count },
      ),
      'success',
    );
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskExternalValidationConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button
            onClick={() =>
              publish(
                'setCellError',
                gridApi.setCellError('task-1', 'task', t('서버에서 작업명을 확인하지 못했습니다.')),
              )
            }
          >
            {t('메시지 1건 표시')}
          </Button>
          <Button
            onClick={() =>
              publish(
                'setCellErrors',
                gridApi.setCellErrors([
                  {
                    rowId: 'task-1',
                    columnId: 'task',
                    message: t('작업명이 올바르지 않습니다.'),
                  },
                  {
                    rowId: 'task-2',
                    columnId: 'completed',
                    message: t('완료 수량이 올바르지 않습니다.'),
                  },
                ]),
              )
            }
          >
            {t('메시지 2건 표시')}
          </Button>
          <Button onClick={handleClearValidationMessages}>{t('검증 메시지 모두 지우기')}</Button>
        </div>
      </PreviewActions>
      {feedback}
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskExternalValidationConfiguration.rows}
          columns={taskExternalValidationConfiguration.columns}
          getRowId={taskExternalValidationConfiguration.getRowId}
          rowSelectionMode={taskExternalValidationConfiguration.rowSelectionMode}
          height="100%"
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
