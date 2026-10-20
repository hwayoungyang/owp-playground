import './styles.css';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef } from '@owp/datagrid/types';
import { useRef } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../types';
import type { TaskGridProps } from '../types';
import { spanningTaskTreeConfiguration } from './configs/spanningTaskTree';

export { spanningTaskTreeConfiguration as gridConfiguration } from './configs/spanningTaskTree';

export function SpanningTreeGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;

  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={() => gridRef.current?.expandAll()}>{translate('전체 펼치기')}</Button>
          <Button onClick={() => gridRef.current?.collapseAll()}>{translate('전체 접기')}</Button>
        </div>
      </PreviewActions>

      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
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
