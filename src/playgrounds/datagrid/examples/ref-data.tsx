import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId } from '@owp/datagrid/types';
import { useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { getRowId } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { taskDataAccessConfiguration } from './configs/taskDataAccess';

export { taskDataAccessConfiguration as gridConfiguration } from './configs/taskDataAccess';

export function BatchRowsGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const handleSelectionChange = (ids: readonly OwpDataGridRowId[]) => {
    setSelection(ids);
    gridProps.onRowSelectionModelChange?.([...ids]);
  };
  const handleCompleteRows = (scope: 'all' | 'visible' | 'selected') => {
    const grid = gridApi;
    if (!grid.commitEditing()) return;
    const readRows = {
      all: () => grid.getRows(),
      visible: () => grid.getVisibleRows(),
      selected: () => grid.getSelectedRows(),
    };
    const api = {
      all: 'getRows',
      visible: 'getVisibleRows',
      selected: 'getSelectedRows',
    } as const;
    const rows = readRows[scope]();
    onAction?.(api[scope], {
      rowIds: rows.map(getRowId),
    });
    const result = grid.applyTransaction(
      rows.flatMap((row) => [
        { type: 'setCellValue' as const, rowId: row.id, columnId: 'status', value: '완료' },
        {
          type: 'setCellValue' as const,
          rowId: row.id,
          columnId: 'completed',
          value: row.quantity,
        },
      ]),
    );
    onAction?.('applyTransaction', result);
  };
  const handleSelectIncompleteRows = () => {
    const grid = gridApi;
    if (!grid.commitEditing()) return;
    const rows = grid.getRows().filter((row) => row.status !== '완료');
    handleSelectionChange(rows.map(getRowId));
    onAction?.('getRows', { rowIds: rows.map(getRowId) });
  };
  const handleFocusSelectedRow = () => {
    const id = selected[0];
    const row = id === undefined ? undefined : gridApi.getRow(id);
    if (row) {
      gridApi.focusCell(row.id, 'task');
      onAction?.('getRow', row);
    }
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskDataAccessConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={handleSelectIncompleteRows}>{t('미완료 행 선택')}</Button>
          <Button onClick={() => handleCompleteRows('all')}>{t('전체 행 완료 처리')}</Button>
          <Button onClick={() => handleCompleteRows('visible')}>{t('필터 결과 완료 처리')}</Button>
          <Button disabled={selected.length === 0} onClick={() => handleCompleteRows('selected')}>
            {t('선택 행 완료 처리')}
          </Button>
          <Button disabled={selected.length !== 1} onClick={handleFocusSelectedRow}>
            {t('선택 행으로 이동')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskDataAccessConfiguration.rows}
          columns={taskDataAccessConfiguration.columns}
          getRowId={taskDataAccessConfiguration.getRowId}
          rowSelectionMode={taskDataAccessConfiguration.rowSelectionMode}
          height="100%"
          layout={taskDataAccessConfiguration.layout}
          {...gridProps}
          rowSelectionModel={selected}
          onRowSelectionModelChange={handleSelectionChange}
        />
      </div>
    </div>
  );
}
