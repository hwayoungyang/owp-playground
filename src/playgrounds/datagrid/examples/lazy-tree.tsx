import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId } from '@owp/datagrid/types';
import { useState } from 'react';
import type { Task, TaskGridProps } from '../types';
import { lazyTaskTreeConfiguration } from './configs/lazyTaskTree';

export { lazyTaskTreeConfiguration as gridConfiguration } from './configs/lazyTaskTree';

export function LazyTreeGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const handleAction = (api: string, value: unknown) => {
    onAction?.(api, value);
  };
  const target = selected[0] ?? 'project-0';
  const handleLoadChildren = async () => {
    const success = await gridApi.loadChildren(target);
    handleAction('loadChildren', success);
  };
  const handleReloadChildren = async () => {
    const success = await gridApi.reloadChildren(target);
    handleAction('reloadChildren', success);
  };
  const handleRowSelectionModelChange: NonNullable<TaskGridProps['onRowSelectionModelChange']> = (
    next,
  ) => {
    setSelection(next);
    gridProps.onRowSelectionModelChange?.(next);
  };
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={() => void handleLoadChildren()}>{t('하위 행 불러오기')}</Button>
          <Button onClick={() => void handleReloadChildren()}>{t('하위 행 다시 불러오기')}</Button>
          <Button
            onClick={() =>
              handleAction('getChildrenLoadState', gridApi.getChildrenLoadState(target))
            }
          >
            {t('조회 상태')}
          </Button>
          <Button onClick={() => gridApi.expandRow(target)}>{t('선택 행 펼치기')}</Button>
          <Button onClick={() => gridApi.collapseRow(target)}>{t('선택 행 접기')}</Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={lazyTaskTreeConfiguration.rows}
          columns={lazyTaskTreeConfiguration.columns}
          getRowId={lazyTaskTreeConfiguration.getRowId}
          height="100%"
          rowSelectionMode="multiple"
          treeOptions={lazyTaskTreeConfiguration.treeOptions}
          rowSelectionPropagation={lazyTaskTreeConfiguration.rowSelectionPropagation}
          {...gridProps}
          rowSelectionModel={selected}
          onRowSelectionModelChange={handleRowSelectionModelChange}
        />
      </div>
    </div>
  );
}
