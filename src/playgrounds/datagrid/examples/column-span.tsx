import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { columnSpanConfiguration } from './configs/columnSpan';

export { columnSpanConfiguration as gridConfiguration } from './configs/columnSpan';

export function ColumnSpanGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={columnSpanConfiguration.rows}
      columns={columnSpanConfiguration.columns}
      getRowId={columnSpanConfiguration.getRowId}
      rowSelectionMode={columnSpanConfiguration.rowSelectionMode}
      height={columnSpanConfiguration.height}
      getCellSpan={columnSpanConfiguration.getCellSpan}
      {...gridProps}
    />
  );
}
