import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { seedTask } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { taskRowActionsConfiguration } from './configs/taskRowActions';

export { taskRowActionsConfiguration as gridConfiguration } from './configs/taskRowActions';

export function RowEditingGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const handleAddRow = () => {
    const row = { ...seedTask, id: crypto.randomUUID(), task: t('새 작업') };
    const success = gridApi.addRow(row, { position: 'root-first' });
    onAction?.('addRow', { success, rowId: row.id });
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskRowActionsConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={handleAddRow}>{t('새 행 추가')}</Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
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
