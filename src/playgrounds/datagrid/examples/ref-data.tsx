import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { getRowId } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { taskDataAccessConfiguration } from './configs/taskDataAccess';

export { taskDataAccessConfiguration as gridConfiguration } from './configs/taskDataAccess';

export function BatchRowsGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const handleSelectionChange = (ids: readonly OwpDataGridRowId[]) => {
    setSelection(ids);
    gridProps.onRowSelectionModelChange?.([...ids]);
  };
  const handleCompleteRows = (scope: 'all' | 'visible' | 'selected') => {
    const grid = gridRef.current;
    if (!grid?.commitEditing()) return;
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
    const grid = gridRef.current;
    if (!grid?.commitEditing()) return;
    const rows = grid.getRows().filter((row) => row.status !== '완료');
    handleSelectionChange(rows.map(getRowId));
    onAction?.('getRows', { rowIds: rows.map(getRowId) });
  };
  const handleFocusSelectedRow = () => {
    const id = selected[0];
    const row = id === undefined ? undefined : gridRef.current?.getRow(id);
    if (row) {
      gridRef.current?.focusCell(row.id, 'task');
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
          <Button onClick={handleSelectIncompleteRows}>{translate('미완료 행 선택')}</Button>
          <Button onClick={() => handleCompleteRows('all')}>
            {translate('전체 행 완료 처리')}
          </Button>
          <Button onClick={() => handleCompleteRows('visible')}>
            {translate('필터 결과 완료 처리')}
          </Button>
          <Button disabled={selected.length === 0} onClick={() => handleCompleteRows('selected')}>
            {translate('선택 행 완료 처리')}
          </Button>
          <Button disabled={selected.length !== 1} onClick={handleFocusSelectedRow}>
            {translate('선택 행으로 이동')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
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
