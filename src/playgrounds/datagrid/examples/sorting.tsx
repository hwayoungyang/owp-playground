import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridSortItem } from '@owp/datagrid/types';
import { useState } from 'react';
import type { Task, TaskGridProps } from '../types';
import { taskSortingConfiguration } from './configs/taskSorting';

export { taskSortingConfiguration as gridConfiguration } from './configs/taskSorting';

export function MultiSortGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const [model, setModel] = useState<readonly OwpDataGridSortItem[]>(
    taskSortingConfiguration.defaultSortModel ?? [],
  );
  const handleSortModelChange: NonNullable<TaskGridProps['onSortModelChange']> = (next) => {
    setModel(next);
    gridProps.onSortModelChange?.(next);
  };
  return (
    <OwpDataGrid
      api={gridApi}
      rows={taskSortingConfiguration.rows}
      columns={taskSortingConfiguration.columns}
      getRowId={taskSortingConfiguration.getRowId}
      rowSelectionMode="multiple"
      height={420}
      defaultSortModel={taskSortingConfiguration.defaultSortModel}
      sortInteraction="priority"
      maxSortColumns={3}
      multiSort={true}
      {...gridProps}
      sortModel={gridProps.sortModel ?? model}
      onSortModelChange={handleSortModelChange}
    />
  );
}
