import './styles.css';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../types';
import type { TaskGridProps } from '../types';
import { lazyTaskTreeConfiguration } from './configs/lazyTaskTree';

export { lazyTaskTreeConfiguration as gridConfiguration } from './configs/lazyTaskTree';

export function LazyTreeGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const handleAction = (api: string, value: unknown) => {
    onAction?.(api, value);
  };
  const target = selected[0] ?? 'project-0';
  const handleLoadChildren = async () => {
    const success = await gridRef.current?.loadChildren(target);
    handleAction('loadChildren', success);
  };
  const handleReloadChildren = async () => {
    const success = await gridRef.current?.reloadChildren(target);
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
          <Button onClick={() => void handleLoadChildren()}>{translate('하위 행 불러오기')}</Button>
          <Button onClick={() => void handleReloadChildren()}>
            {translate('하위 행 다시 불러오기')}
          </Button>
          <Button
            onClick={() =>
              handleAction('getChildrenLoadState', gridRef.current?.getChildrenLoadState(target))
            }
          >
            {translate('조회 상태')}
          </Button>
          <Button onClick={() => gridRef.current?.expandRow(target)}>
            {translate('선택 행 펼치기')}
          </Button>
          <Button onClick={() => gridRef.current?.collapseRow(target)}>
            {translate('선택 행 접기')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
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
