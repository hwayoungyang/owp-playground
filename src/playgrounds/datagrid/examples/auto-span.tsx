import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { automaticRowSpanConfiguration } from './configs/automaticRowSpan';

export { automaticRowSpanConfiguration as gridConfiguration } from './configs/automaticRowSpan';

export function AutomaticRowSpanGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={automaticRowSpanConfiguration.rows}
      columns={automaticRowSpanConfiguration.columns}
      getRowId={automaticRowSpanConfiguration.getRowId}
      rowSelectionMode={automaticRowSpanConfiguration.rowSelectionMode}
      height={automaticRowSpanConfiguration.height}
      getCellRowSpanKey={automaticRowSpanConfiguration.getCellRowSpanKey}
      layout={automaticRowSpanConfiguration.layout}
      {...gridProps}
    />
  );
}
