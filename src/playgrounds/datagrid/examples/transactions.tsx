import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskTransactionsConfiguration } from './configs/taskTransactions';

export { taskTransactionsConfiguration as gridConfiguration } from './configs/taskTransactions';

export function TransactionsGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const publish = (api: string, value: unknown) => {
    onAction?.(api, value);
  };
  const handleCompleteRows = () => {
    const targets = selected.length
      ? selected
      : (gridRef.current
          ?.getRows()
          .slice(0, 3)
          .map((row) => row.id) ?? []);
    publish(
      'applyTransaction',
      gridRef.current?.applyTransaction(
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
    const api = gridRef.current;
    if (!api?.commitEditing()) {
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
            {translate('일괄 완료')}
          </Button>
          <Button variant="outlined" onClick={handleAcceptChanges}>
            {translate('변경 확정')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
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
