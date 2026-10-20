import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowDragMode } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskReorderingConfiguration } from './configs/taskReordering';

export { taskReorderingConfiguration as gridConfiguration } from './configs/taskReordering';

export function DraggableRowsGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const [mode, setMode] = useState<OwpDataGridRowDragMode>('selected');
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction, onDataChange } = callbacks ?? {};
  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskReorderingConfiguration.height }}
    >
      <PreviewActions>
        <fieldset className="example-controls" aria-label={translate('드래그 대상')}>
          {(['single', 'selected'] as const).map((value) => (
            <Button
              key={value}
              variant={mode === value ? 'contained' : 'outlined'}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {translate(value === 'single' ? '단일 행' : '선택 행')}
            </Button>
          ))}
        </fieldset>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
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
              onDataChange?.(gridRef.current?.getRows() ?? []);
            },
          }}
        />
      </div>
    </div>
  );
}
