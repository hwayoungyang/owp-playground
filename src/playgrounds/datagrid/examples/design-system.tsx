import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId } from '@owp/datagrid/types';
import { useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskDesignSystemConfiguration } from './configs/taskDesignSystem';

export { taskDesignSystemConfiguration as gridConfiguration } from './configs/taskDesignSystem';

export function ExternalControlsGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const handleSelectionChange = (next: readonly OwpDataGridRowId[]) => {
    setSelection(next);
    gridProps.onRowSelectionModelChange?.([...next]);
  };
  const handleSelectFirstRow = () => {
    const row = gridApi.getRows()[0];
    if (row) handleSelectionChange([row.id]);
  };
  const handleDeleteSelectedRows = () => {
    const ids = gridApi.deleteRows(selected);
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
            {t('첫 행 선택')}
          </Button>
          <Button variant="outlined" onClick={() => handleSelectionChange([])}>
            {t('선택 해제')}
          </Button>
          <Button
            variant="outlined"
            disabled={selected.length === 0}
            onClick={handleDeleteSelectedRows}
          >
            {t('행 삭제')}
          </Button>
          <span className="status-badge status-1">
            <span className="status-dot" />
            {t('완료')}
          </span>
          <span className="status-badge status-2">
            <span className="status-dot" />
            {t('검토 중')}
          </span>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
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
