import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowDragMode } from '@owp/datagrid/types';
import { useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskReorderingConfiguration } from './configs/taskReordering';

export { taskReorderingConfiguration as gridConfiguration } from './configs/taskReordering';

export function DraggableRowsGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const [mode, setMode] = useState<OwpDataGridRowDragMode>('selected');
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction, onDataChange } = callbacks ?? {};
  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskReorderingConfiguration.height }}
    >
      <PreviewActions>
        <fieldset className="example-controls" aria-label={t('드래그 대상')}>
          {(['single', 'selected'] as const).map((value) => (
            <Button
              key={value}
              variant={mode === value ? 'contained' : 'outlined'}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {t(value === 'single' ? '단일 행' : '선택 행')}
            </Button>
          ))}
        </fieldset>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskReorderingConfiguration.rows}
          columns={taskReorderingConfiguration.columns}
          getRowId={taskReorderingConfiguration.getRowId}
          rowSelectionMode={taskReorderingConfiguration.rowSelectionMode}
          height={taskReorderingConfiguration.height}
          {...gridProps}
          rowReordering={{
            dragMode: mode,
            onRowsMove: ({ rowIds, targetRowId, placement }) => {
              onAction?.('rows.drag', { rowIds, targetRowId, placement });
              onDataChange?.(gridApi.getRows());
            },
          }}
        />
      </div>
    </div>
  );
}
