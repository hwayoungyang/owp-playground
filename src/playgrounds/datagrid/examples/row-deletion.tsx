import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { seedTask } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { taskRowDeletionConfiguration } from './configs/taskRowDeletion';

export { taskRowDeletionConfiguration as gridConfiguration } from './configs/taskRowDeletion';

export function DeleteRestoreRowsGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const [deleted, setDeleted] = useState<readonly OwpDataGridRowId[]>([]);
  const publish = (api: string, value: unknown) => {
    onAction?.(api, value);
  };
  const handleDeleteSelectedRows = () => {
    const ids = gridRef.current?.deleteRows(selected) ?? [];
    setDeleted(ids);
    publish('deleteRows', ids);
  };
  const handleRestoreDeletedRows = () => {
    publish('undeleteRows', gridRef.current?.undeleteRows(deleted));
    setDeleted([]);
  };
  const handleDiscardAddedRows = () => {
    const added =
      gridRef.current
        ?.getChanges()
        .filter((change) => change.type === 'added')
        .map((change) => change.rowId) ?? [];
    publish('discardAddedRows', gridRef.current?.discardAddedRows(added));
  };
  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskRowDeletionConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button
            onClick={() =>
              publish(
                'addRow',
                gridRef.current?.addRow(
                  {
                    ...seedTask,
                    id: crypto.randomUUID(),
                    task: translate('새 작업'),
                  },
                  { position: 'root-first' },
                ),
              )
            }
          >
            {translate('새 행 추가')}
          </Button>
          <Button disabled={selected.length === 0} onClick={handleDeleteSelectedRows}>
            {translate('선택 행 삭제')}
          </Button>
          <Button disabled={deleted.length === 0} onClick={handleRestoreDeletedRows}>
            {translate('삭제 복구')}
          </Button>
          <Button onClick={handleDiscardAddedRows}>{translate('새 행 추가 취소')}</Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={taskRowDeletionConfiguration.rows}
          columns={taskRowDeletionConfiguration.columns}
          getRowId={taskRowDeletionConfiguration.getRowId}
          rowSelectionMode={taskRowDeletionConfiguration.rowSelectionMode}
          height="100%"
          rowDeletion={taskRowDeletionConfiguration.rowDeletion}
          rowAnimation={taskRowDeletionConfiguration.rowAnimation}
          layout={taskRowDeletionConfiguration.layout}
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
