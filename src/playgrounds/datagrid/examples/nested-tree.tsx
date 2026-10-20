import './styles.css';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../types';
import type { TaskGridProps } from '../types';
import { nestedTaskTreeConfiguration } from './configs/nestedTaskTree';

export { nestedTaskTreeConfiguration as gridConfiguration } from './configs/nestedTaskTree';

export function NestedTaskTreeGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [expanded, setExpanded] = useState<readonly OwpDataGridRowId[]>(
    nestedTaskTreeConfiguration.treeOptions?.defaultExpansionModel ?? [],
  );
  const handleExpansionChange = (next: readonly OwpDataGridRowId[]) => {
    setExpanded(next);
    onAction?.('expansion', next);
  };
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={() => gridRef.current?.expandAll()}>{translate('전체 펼치기')}</Button>
          <Button onClick={() => gridRef.current?.collapseAll()}>{translate('전체 접기')}</Button>
          <Button onClick={() => gridRef.current?.expandRow('project-0')}>
            {translate('첫 프로젝트 펼치기')}
          </Button>
          <Button onClick={() => gridRef.current?.collapseRow('project-0')}>
            {translate('첫 프로젝트 접기')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={nestedTaskTreeConfiguration.rows}
          columns={nestedTaskTreeConfiguration.columns}
          getRowId={nestedTaskTreeConfiguration.getRowId}
          height="100%"
          rowSelectionMode="multiple"
          rowSelectionPropagation={nestedTaskTreeConfiguration.rowSelectionPropagation}
          layout={nestedTaskTreeConfiguration.layout}
          {...gridProps}
          treeOptions={{
            mode: 'nested',
            getChildren: (row) => row.children,
            filterFromLeafRows: true,
            indentation: 20,
            expansionModel: expanded,
            onExpansionModelChange: handleExpansionChange,
          }}
        />
      </div>
    </div>
  );
}
