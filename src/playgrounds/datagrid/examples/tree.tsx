import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { Button, MenuItem, Select } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getRowId, initialTasks } from '../model/data';
import { loadRows } from '../model/server';
import type { Task, TaskGridProps } from '../types';
import { taskTreeConfiguration, treeRows } from './configs/taskTree';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export { taskTreeConfiguration as gridConfiguration } from './configs/taskTree';

export function TaskTreeGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction, onDataChange } = callbacks ?? {};
  const mounted = useRef(false);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [lazy, setLazy] = useState(false);
  const rows = useMemo(
    () => (lazy ? treeRows.filter((row) => row.parentId === null) : treeRows),
    [lazy],
  );
  useEffect(() => {
    onDataChange?.(rows);
  }, [rows, onDataChange]);
  const options = useMemo<OwpDataGridProps<Task, Task>['treeOptions']>(
    () =>
      lazy
        ? {
            mode: 'parent-reference',
            getParentRowId: (row) => row.parentId,
            getRowCanExpand: (row) => row.parentId === null,
            lazyChildren: {
              loadChildren: async ({ row, signal }) => {
                const children = await loadRows(
                  initialTasks
                    .filter((task) => task.project === row.project)
                    .map((task) => ({ ...task, parentId: row.id })),
                  signal,
                );
                onAction?.('tree.loadChildren', { rowId: row.id, count: children.length });
                requestAnimationFrame(() => {
                  if (mounted.current && !signal.aborted) onDataChange?.(gridApi.getRows());
                });
                return children;
              },
            },
          }
        : {
            mode: 'parent-reference',
            getParentRowId: (row) => row.parentId,
            defaultExpansionModel: treeRows.filter((row) => row.parentId === null).map(getRowId),
          },
    [lazy, onAction, onDataChange, gridApi],
  );
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-settings-toolbar example-settings-toolbar--general">
          <div
            className="example-settings-fields example-settings-fields--general"
            data-columns="1"
          >
            <div className="example-setting-field">
              <span className="example-setting-label">{t('하위 데이터')}</span>
              <Select
                value={lazy ? 'lazy' : 'all'}
                inputProps={{ 'aria-label': t('하위 데이터') }}
                onChange={(event) => {
                  setLazy(event.target.value === 'lazy');
                  gridProps.onRowSelectionModelChange?.([]);
                }}
              >
                <MenuItem value="all">{t('미리 불러오기')}</MenuItem>
                <MenuItem value="lazy">{t('펼칠 때 불러오기')}</MenuItem>
              </Select>
            </div>
          </div>
          <div className="example-settings-actions">
            <Button onClick={() => gridApi.expandAll()}>{t('전체 펼치기')}</Button>
            <Button onClick={() => gridApi.collapseAll()}>{t('전체 접기')}</Button>
          </div>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          key={String(lazy)}
          api={gridApi}
          columns={taskTreeConfiguration.columns}
          getRowId={taskTreeConfiguration.getRowId}
          rowSelectionMode="multiple"
          rowSelectionPropagation={taskTreeConfiguration.rowSelectionPropagation}
          {...gridProps}
          rows={rows}
          treeOptions={options}
          height="100%"
        />
      </div>
    </div>
  );
}
