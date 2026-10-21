import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId } from '@owp/datagrid/types';
import { useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { seedTask } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { taskRowDeletionConfiguration } from './configs/taskRowDeletion';

export { taskRowDeletionConfiguration as gridConfiguration } from './configs/taskRowDeletion';

export function DeleteRestoreRowsGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const [deleted, setDeleted] = useState<readonly OwpDataGridRowId[]>([]);
  const publish = (api: string, value: unknown) => {
    onAction?.(api, value);
  };
  const handleDeleteSelectedRows = () => {
    const ids = gridApi.deleteRows(selected);
    setDeleted(ids);
    publish('deleteRows', ids);
  };
  const handleRestoreDeletedRows = () => {
    publish('undeleteRows', gridApi.undeleteRows(deleted));
    setDeleted([]);
  };
  const handleDiscardAddedRows = () => {
    const added = gridApi
      .getChanges()
      .filter((change) => change.type === 'added')
      .map((change) => change.rowId);
    publish('discardAddedRows', gridApi.discardAddedRows(added));
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
                gridApi.addRow(
                  {
                    ...seedTask,
                    id: crypto.randomUUID(),
                    task: t('새 작업'),
                  },
                  { position: 'root-first' },
                ),
              )
            }
          >
            {t('새 행 추가')}
          </Button>
          <Button disabled={selected.length === 0} onClick={handleDeleteSelectedRows}>
            {t('선택 행 삭제')}
          </Button>
          <Button disabled={deleted.length === 0} onClick={handleRestoreDeletedRows}>
            {t('삭제 복구')}
          </Button>
          <Button onClick={handleDiscardAddedRows}>{t('새 행 추가 취소')}</Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
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
