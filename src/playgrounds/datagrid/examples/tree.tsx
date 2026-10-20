import './styles.css';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { Button, MenuItem, Select } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef } from '@owp/datagrid/types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../types';
import { getRowId, initialTasks } from '../model/data';
import { loadRows } from '../model/server';
import type { TaskGridProps } from '../types';
import { taskTreeConfiguration, treeRows } from './configs/taskTree';
import type { OwpDataGridProps } from '@owp/datagrid/types';

export { taskTreeConfiguration as gridConfiguration } from './configs/taskTree';

export function TaskTreeGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction, onDataChange } = callbacks ?? {};
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
                  if (!signal.aborted) onDataChange?.(gridRef.current?.getRows() ?? []);
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
    [lazy, onAction, onDataChange, gridRef],
  );
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <span>{translate('하위 데이터')}</span>
          <Select
            value={lazy ? 'lazy' : 'all'}
            inputProps={{ 'aria-label': translate('하위 데이터') }}
            onChange={(event) => {
              setLazy(event.target.value === 'lazy');
              gridProps.onRowSelectionModelChange?.([]);
            }}
          >
            <MenuItem value="all">{translate('미리 불러오기')}</MenuItem>
            <MenuItem value="lazy">{translate('펼칠 때 불러오기')}</MenuItem>
          </Select>
          <Button onClick={() => gridRef.current?.expandAll()}>{translate('전체 펼치기')}</Button>
          <Button onClick={() => gridRef.current?.collapseAll()}>{translate('전체 접기')}</Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          key={String(lazy)}
          ref={gridRef}
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
