import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridFilterItem } from '@owp/datagrid/types';
import { useState } from 'react';
import type { Task, TaskGridProps } from '../types';
import { taskFilteringConfiguration } from './configs/taskFiltering';

export { taskFilteringConfiguration as gridConfiguration } from './configs/taskFiltering';

export function ColumnFiltersGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const [model, setModel] = useState<readonly OwpDataGridFilterItem[]>(
    taskFilteringConfiguration.defaultFilterModel ?? [],
  );
  const handleFilterModelChange: NonNullable<TaskGridProps['onFilterModelChange']> = (next) => {
    setModel(next);
    gridProps.onFilterModelChange?.(next);
  };
  return (
    <OwpDataGrid
      api={gridApi}
      rows={taskFilteringConfiguration.rows}
      columns={taskFilteringConfiguration.columns}
      getRowId={taskFilteringConfiguration.getRowId}
      rowSelectionMode="multiple"
      height={420}
      layout={taskFilteringConfiguration.layout}
      {...gridProps}
      filterModel={gridProps.filterModel ?? model}
      onFilterModelChange={handleFilterModelChange}
    />
  );
}
