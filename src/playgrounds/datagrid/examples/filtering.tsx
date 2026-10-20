import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridFilterItem } from '@owp/datagrid/types';
import { useState } from 'react';
import type { TaskGridProps } from '../types';
import { taskFilteringConfiguration } from './configs/taskFiltering';

export { taskFilteringConfiguration as gridConfiguration } from './configs/taskFiltering';

export function ColumnFiltersGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  const [model, setModel] = useState<readonly OwpDataGridFilterItem[]>(
    taskFilteringConfiguration.defaultFilterModel ?? [],
  );
  const handleFilterModelChange: NonNullable<TaskGridProps['onFilterModelChange']> = (next) => {
    setModel(next);
    gridProps.onFilterModelChange?.(next);
  };
  return (
    <OwpDataGrid
      ref={gridRef}
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
