import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { taskLargeDataConfiguration } from './configs/taskLargeData';

export { taskLargeDataConfiguration as gridConfiguration } from './configs/taskLargeData';

export function LargeDatasetGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={taskLargeDataConfiguration.rows}
      columns={taskLargeDataConfiguration.columns}
      getRowId={taskLargeDataConfiguration.getRowId}
      rowSelectionMode={taskLargeDataConfiguration.rowSelectionMode}
      height={taskLargeDataConfiguration.height}
      virtualization={taskLargeDataConfiguration.virtualization}
      {...gridProps}
    />
  );
}
