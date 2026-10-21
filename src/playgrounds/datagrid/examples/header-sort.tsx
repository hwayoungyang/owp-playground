import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { headerSortConfiguration } from './configs/headerSort';

export { headerSortConfiguration as gridConfiguration } from './configs/headerSort';

export function HeaderSortGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={headerSortConfiguration.rows}
      columns={headerSortConfiguration.columns}
      getRowId={headerSortConfiguration.getRowId}
      rowSelectionMode={headerSortConfiguration.rowSelectionMode}
      height={headerSortConfiguration.height}
      headerRows={headerSortConfiguration.headerRows}
      hideChildHeaderSortButtons={false}
      {...gridProps}
    />
  );
}
