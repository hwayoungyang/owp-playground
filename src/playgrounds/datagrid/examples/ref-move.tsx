import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskMoveConfiguration } from './configs/taskMove';

export { taskMoveConfiguration as gridConfiguration } from './configs/taskMove';

export function MoveRowsGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;

  const publish = (api: string, value: unknown) => {
    onAction?.(api, value);
  };

  const handleMoveSelectedRowToTop = () => {
    const id = selected[0];
    if (id !== undefined)
      publish('moveRow', gridRef.current?.moveRow(id, { position: 'root-first' }));
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskMoveConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button disabled={selected.length !== 1} onClick={handleMoveSelectedRowToTop}>
            {translate('단일 행 맨 위로')}
          </Button>
          <Button
            disabled={selected.length === 0}
            onClick={() =>
              publish('moveRows', gridRef.current?.moveRows(selected, { position: 'root-first' }))
            }
          >
            {translate('선택 행 맨 위로')}
          </Button>
          <Button
            disabled={selected.length === 0}
            onClick={() =>
              publish('moveRows', gridRef.current?.moveRows(selected, { position: 'root-last' }))
            }
          >
            {translate('선택 행 맨 아래로')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
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
