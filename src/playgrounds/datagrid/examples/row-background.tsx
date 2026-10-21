import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { getRowId } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { rowBackgroundColumns, rowBackgroundConfiguration } from './configs/rowBackground';

export { rowBackgroundConfiguration as gridConfiguration } from './configs/rowBackground';

export function RowBackgroundGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={rowBackgroundConfiguration.rows}
      columns={rowBackgroundColumns}
      getRowId={getRowId}
      rowSelectionMode="multiple"
      height={420}
      {...gridProps}
    />
  );
}
