import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { virtualizedSpansConfiguration } from './configs/virtualizedSpans';

export { virtualizedSpansConfiguration as gridConfiguration } from './configs/virtualizedSpans';

export function VirtualizedSpansGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={virtualizedSpansConfiguration.rows}
      columns={virtualizedSpansConfiguration.columns}
      getRowId={virtualizedSpansConfiguration.getRowId}
      rowSelectionMode={virtualizedSpansConfiguration.rowSelectionMode}
      height={virtualizedSpansConfiguration.height}
      getCellRowSpanKey={virtualizedSpansConfiguration.getCellRowSpanKey}
      virtualization={virtualizedSpansConfiguration.virtualization}
      {...gridProps}
    />
  );
}
