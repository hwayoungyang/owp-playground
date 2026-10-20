import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskDesignSystemConfiguration } from './configs/taskDesignSystem';

export { taskDesignSystemConfiguration as gridConfiguration } from './configs/taskDesignSystem';

export function ExternalControlsGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const handleSelectionChange = (next: readonly OwpDataGridRowId[]) => {
    setSelection(next);
    gridProps.onRowSelectionModelChange?.([...next]);
  };
  const handleSelectFirstRow = () => {
    const row = gridRef.current?.getRows()[0];
    if (row) handleSelectionChange([row.id]);
  };
  const handleDeleteSelectedRows = () => {
    const ids = gridRef.current?.deleteRows(selected);
    onAction?.('deleteRows', ids);
    handleSelectionChange([]);
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskDesignSystemConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button variant="outlined" onClick={handleSelectFirstRow}>
            {translate('첫 행 선택')}
          </Button>
          <Button variant="outlined" onClick={() => handleSelectionChange([])}>
            {translate('선택 해제')}
          </Button>
          <Button
            variant="outlined"
            disabled={selected.length === 0}
            onClick={handleDeleteSelectedRows}
          >
            {translate('행 삭제')}
          </Button>
          <span className="status-badge status-1">
            <span className="status-dot" />
            {translate('완료')}
          </span>
          <span className="status-badge status-2">
            <span className="status-dot" />
            {translate('검토 중')}
          </span>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={taskDesignSystemConfiguration.rows}
          columns={taskDesignSystemConfiguration.columns}
          getRowId={taskDesignSystemConfiguration.getRowId}
          rowSelectionMode={taskDesignSystemConfiguration.rowSelectionMode}
          rowDeletion={taskDesignSystemConfiguration.rowDeletion}
          {...gridProps}
          height="100%"
          rowSelectionModel={selected}
          onRowSelectionModelChange={handleSelectionChange}
        />
      </div>
    </div>
  );
}
