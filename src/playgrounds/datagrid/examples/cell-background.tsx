import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { getRowId } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { cellBackgroundColumns, cellBackgroundConfiguration } from './configs/cellBackground';

export { cellBackgroundConfiguration as gridConfiguration } from './configs/cellBackground';

export function CellBackgroundGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={cellBackgroundConfiguration.rows}
      columns={cellBackgroundColumns}
      getRowId={getRowId}
      rowSelectionMode="multiple"
      height={420}
      {...gridProps}
    />
  );
}
