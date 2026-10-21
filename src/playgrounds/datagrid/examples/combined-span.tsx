import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { combinedSpanConfiguration } from './configs/combinedSpan';

export { combinedSpanConfiguration as gridConfiguration } from './configs/combinedSpan';

export function CombinedSpanGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={combinedSpanConfiguration.rows}
      columns={combinedSpanConfiguration.columns}
      getRowId={combinedSpanConfiguration.getRowId}
      rowSelectionMode={combinedSpanConfiguration.rowSelectionMode}
      height={combinedSpanConfiguration.height}
      getCellRowSpanKey={combinedSpanConfiguration.getCellRowSpanKey}
      getCellSpan={combinedSpanConfiguration.getCellSpan}
      headerRows={combinedSpanConfiguration.headerRows}
      {...gridProps}
    />
  );
}
