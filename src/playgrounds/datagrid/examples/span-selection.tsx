import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { spanSelectionConfiguration } from './configs/spanSelection';

export { spanSelectionConfiguration as gridConfiguration } from './configs/spanSelection';

export function SpanSelectionGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={spanSelectionConfiguration.rows}
      columns={spanSelectionConfiguration.columns}
      getRowId={spanSelectionConfiguration.getRowId}
      rowSelectionMode={spanSelectionConfiguration.rowSelectionMode}
      height={spanSelectionConfiguration.height}
      getCellRowSpanKey={spanSelectionConfiguration.getCellRowSpanKey}
      rowSelectionScope={spanSelectionConfiguration.rowSelectionScope}
      rowDeletion={spanSelectionConfiguration.rowDeletion}
      {...gridProps}
    />
  );
}
