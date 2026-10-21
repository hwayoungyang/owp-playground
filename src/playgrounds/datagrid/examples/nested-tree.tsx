import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId } from '@owp/datagrid/types';
import { useState } from 'react';
import type { Task, TaskGridProps } from '../types';
import { nestedTaskTreeConfiguration } from './configs/nestedTaskTree';

export { nestedTaskTreeConfiguration as gridConfiguration } from './configs/nestedTaskTree';

export function NestedTaskTreeGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
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
          <Button onClick={() => gridApi.expandAll()}>{t('전체 펼치기')}</Button>
          <Button onClick={() => gridApi.collapseAll()}>{t('전체 접기')}</Button>
          <Button onClick={() => gridApi.expandRow('project-0')}>{t('첫 프로젝트 펼치기')}</Button>
          <Button onClick={() => gridApi.collapseRow('project-0')}>{t('첫 프로젝트 접기')}</Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
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
