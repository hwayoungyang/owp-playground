import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskExternalValidationConfiguration } from './configs/taskExternalValidation';

export { taskExternalValidationConfiguration as gridConfiguration } from './configs/taskExternalValidation';

export function ValidationMessagesGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const [feedback, setFeedback] = useState<{ message: string; count?: number } | null>(null);

  const publish = (api: string, value: unknown) => {
    onAction?.(api, value);
    const count = gridRef.current?.getCellErrors().length ?? 0;
    setFeedback({
      message:
        count === 0
          ? '표시된 검증 메시지가 없습니다.'
          : '검증 메시지 {{count}}건이 표시되어 있습니다.',
      count,
    });
  };

  const handleClearValidationMessages = () => {
    gridRef.current?.clearCellErrors();
    onAction?.('clearCellErrors', { cleared: true });
    setFeedback({ message: '검증 메시지를 모두 지웠습니다.' });
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
                gridRef.current?.setCellError(
                  'task-1',
                  'task',
                  translate('서버에서 작업명을 확인하지 못했습니다.'),
                ),
              )
            }
          >
            {translate('메시지 1건 표시')}
          </Button>
          <Button
            onClick={() =>
              publish(
                'setCellErrors',
                gridRef.current?.setCellErrors([
                  {
                    rowId: 'task-1',
                    columnId: 'task',
                    message: translate('작업명이 올바르지 않습니다.'),
                  },
                  {
                    rowId: 'task-2',
                    columnId: 'completed',
                    message: translate('완료 수량이 올바르지 않습니다.'),
                  },
                ]),
              )
            }
          >
            {translate('메시지 2건 표시')}
          </Button>
          <Button onClick={handleClearValidationMessages}>
            {translate('검증 메시지 모두 지우기')}
          </Button>
        </div>
      </PreviewActions>
      {feedback && (
        <p className="example-caption" role="status">
          {translate(feedback.message, { count: feedback.count })}
        </p>
      )}
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
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
