import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId } from '@owp/datagrid/types';
import { useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskTransactionsConfiguration } from './configs/taskTransactions';

export { taskTransactionsConfiguration as gridConfiguration } from './configs/taskTransactions';

export function TransactionsGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const publish = (api: string, value: unknown) => {
    onAction?.(api, value);
  };
  const handleCompleteRows = () => {
    const targets = selected.length
      ? selected
      : gridApi
          .getRows()
          .slice(0, 3)
          .map((row) => row.id);
    publish(
      'applyTransaction',
      gridApi.applyTransaction(
        targets.map((rowId) => ({
          type: 'setCellValue',
          rowId,
          columnId: 'status',
          value: '완료',
        })),
      ),
    );
  };
  const handleAcceptChanges = () => {
    const api = gridApi;
    if (!api.commitEditing()) {
      publish('commitEditing', false);
      return;
    }
    const validation = api.validate();
    if (!validation.valid) {
      publish('validate', validation);
      return;
    }
    publish('acceptChanges', api.acceptChanges());
  };
  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskTransactionsConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button variant="outlined" onClick={handleCompleteRows}>
            {t('일괄 완료')}
          </Button>
          <Button variant="outlined" onClick={handleAcceptChanges}>
            {t('변경 확정')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskTransactionsConfiguration.rows}
          columns={taskTransactionsConfiguration.columns}
          getRowId={taskTransactionsConfiguration.getRowId}
          rowSelectionMode={taskTransactionsConfiguration.rowSelectionMode}
          {...gridProps}
          height="100%"
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
