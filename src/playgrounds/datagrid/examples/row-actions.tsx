import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef } from '@owp/datagrid/types';
import { useRef } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { seedTask } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { taskRowActionsConfiguration } from './configs/taskRowActions';

export { taskRowActionsConfiguration as gridConfiguration } from './configs/taskRowActions';

export function RowEditingGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const handleAddRow = () => {
    const row = { ...seedTask, id: crypto.randomUUID(), task: translate('새 작업') };
    const success = gridRef.current?.addRow(row, { position: 'root-first' });
    onAction?.('addRow', { success, rowId: row.id });
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskRowActionsConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={handleAddRow}>{translate('새 행 추가')}</Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={taskRowActionsConfiguration.rows}
          columns={taskRowActionsConfiguration.columns}
          getRowId={taskRowActionsConfiguration.getRowId}
          rowSelectionMode={taskRowActionsConfiguration.rowSelectionMode}
          height="100%"
          rowDeletion={taskRowActionsConfiguration.rowDeletion}
          {...gridProps}
          rowEditToolbar={taskRowActionsConfiguration.rowEditToolbar}
          layout={{
            ...gridProps.layout,
            rowPanel: { ...gridProps.layout?.rowPanel, allowAddedRowSelection: true },
          }}
        />
      </div>
    </div>
  );
}
