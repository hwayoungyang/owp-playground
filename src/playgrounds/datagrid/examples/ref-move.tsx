import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId } from '@owp/datagrid/types';
import { useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskMoveConfiguration } from './configs/taskMove';

export { taskMoveConfiguration as gridConfiguration } from './configs/taskMove';

export function MoveRowsGrid(props: TaskGridProps = {}) {
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

  const handleMoveSelectedRowToTop = () => {
    const id = selected[0];
    if (id !== undefined) publish('moveRow', gridApi.moveRow(id, { position: 'root-first' }));
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskMoveConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button disabled={selected.length !== 1} onClick={handleMoveSelectedRowToTop}>
            {t('단일 행 맨 위로')}
          </Button>
          <Button
            disabled={selected.length === 0}
            onClick={() =>
              publish('moveRows', gridApi.moveRows(selected, { position: 'root-first' }))
            }
          >
            {t('선택 행 맨 위로')}
          </Button>
          <Button
            disabled={selected.length === 0}
            onClick={() =>
              publish('moveRows', gridApi.moveRows(selected, { position: 'root-last' }))
            }
          >
            {t('선택 행 맨 아래로')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskMoveConfiguration.rows}
          columns={taskMoveConfiguration.columns}
          getRowId={taskMoveConfiguration.getRowId}
          rowSelectionMode={taskMoveConfiguration.rowSelectionMode}
          height="100%"
          rowReordering={taskMoveConfiguration.rowReordering}
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
