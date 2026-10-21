import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { pinnedColumnsConfiguration } from './configs/pinnedColumns';

export { pinnedColumnsConfiguration as gridConfiguration } from './configs/pinnedColumns';

export function PinnedColumnsGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={pinnedColumnsConfiguration.rows}
      columns={pinnedColumnsConfiguration.columns}
      getRowId={pinnedColumnsConfiguration.getRowId}
      rowSelectionMode={pinnedColumnsConfiguration.rowSelectionMode}
      height={pinnedColumnsConfiguration.height}
      layout={pinnedColumnsConfiguration.layout}
      {...gridProps}
    />
  );
}
