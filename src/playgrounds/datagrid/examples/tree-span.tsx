import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { spanningTaskTreeConfiguration } from './configs/spanningTaskTree';

export { spanningTaskTreeConfiguration as gridConfiguration } from './configs/spanningTaskTree';

export function SpanningTreeGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;

  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={() => gridApi.expandAll()}>{t('전체 펼치기')}</Button>
          <Button onClick={() => gridApi.collapseAll()}>{t('전체 접기')}</Button>
        </div>
      </PreviewActions>

      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          treeOptions={spanningTaskTreeConfiguration.treeOptions}
          rows={spanningTaskTreeConfiguration.rows}
          columns={spanningTaskTreeConfiguration.columns}
          getRowId={spanningTaskTreeConfiguration.getRowId}
          rowSelectionMode={spanningTaskTreeConfiguration.rowSelectionMode}
          getCellRowSpanKey={spanningTaskTreeConfiguration.getCellRowSpanKey}
          {...gridProps}
          height="100%"
        />
      </div>
    </div>
  );
}
