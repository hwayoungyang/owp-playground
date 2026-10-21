import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { taskMinimalConfiguration } from './configs/taskMinimal';

export { taskMinimalConfiguration as gridConfiguration } from './configs/taskMinimal';

export function MinimalGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={taskMinimalConfiguration.rows}
      columns={taskMinimalConfiguration.columns}
      getRowId={taskMinimalConfiguration.getRowId}
      rowSelectionMode={taskMinimalConfiguration.rowSelectionMode}
      height={taskMinimalConfiguration.height}
      canTotalCountRow={taskMinimalConfiguration.canTotalCountRow}
      {...gridProps}
    />
  );
}
