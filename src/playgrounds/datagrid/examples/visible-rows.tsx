import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { taskVisibleRowsConfiguration } from './configs/taskVisibleRows';

export { taskVisibleRowsConfiguration as gridConfiguration } from './configs/taskVisibleRows';

export function VisibleRowsGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={taskVisibleRowsConfiguration.rows}
      columns={taskVisibleRowsConfiguration.columns}
      getRowId={taskVisibleRowsConfiguration.getRowId}
      rowSelectionMode={taskVisibleRowsConfiguration.rowSelectionMode}
      height={taskVisibleRowsConfiguration.height}
      visibleRowCount={taskVisibleRowsConfiguration.visibleRowCount}
      {...gridProps}
    />
  );
}
