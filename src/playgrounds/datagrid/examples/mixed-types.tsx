import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { rowCellTypesConfiguration } from './configs/rowCellTypes';

export { rowCellTypesConfiguration as gridConfiguration } from './configs/rowCellTypes';

export function RowCellTypesGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={rowCellTypesConfiguration.rows}
      columns={rowCellTypesConfiguration.columns}
      getRowId={rowCellTypesConfiguration.getRowId}
      rowSelectionMode={rowCellTypesConfiguration.rowSelectionMode}
      height={rowCellTypesConfiguration.height}
      {...gridProps}
    />
  );
}
