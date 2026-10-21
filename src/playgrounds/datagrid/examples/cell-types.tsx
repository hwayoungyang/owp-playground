import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { cellTypesConfiguration } from './configs/cellTypes';

export { cellTypesConfiguration as gridConfiguration } from './configs/cellTypes';

export function CellTypesGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={cellTypesConfiguration.rows}
      columns={cellTypesConfiguration.columns}
      getRowId={cellTypesConfiguration.getRowId}
      rowSelectionMode={cellTypesConfiguration.rowSelectionMode}
      height={cellTypesConfiguration.height}
      {...gridProps}
    />
  );
}
