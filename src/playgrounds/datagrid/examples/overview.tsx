import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { taskOverviewConfiguration } from './configs/taskOverview';

export { taskOverviewConfiguration as gridConfiguration } from './configs/taskOverview';

export function FixedRowsGrid({ api: suppliedApi, callbacks, ...gridProps }: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={taskOverviewConfiguration.rows}
      columns={taskOverviewConfiguration.columns}
      getRowId={taskOverviewConfiguration.getRowId}
      rowSelectionMode="multiple"
      height={420}
      visibleRowCount={10}
      summaryRows={taskOverviewConfiguration.summaryRows}
      {...gridProps}
    />
  );
}
