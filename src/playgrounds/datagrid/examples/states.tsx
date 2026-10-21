import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { taskStatesConfiguration } from './configs/taskStates';

export { taskStatesConfiguration as gridConfiguration } from './configs/taskStates';

export function GridStates(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={taskStatesConfiguration.rows}
      columns={taskStatesConfiguration.columns}
      getRowId={taskStatesConfiguration.getRowId}
      rowSelectionMode={taskStatesConfiguration.rowSelectionMode}
      height={taskStatesConfiguration.height}
      noDataMessage={taskStatesConfiguration.noDataMessage}
      loading={false}
      {...gridProps}
    />
  );
}
