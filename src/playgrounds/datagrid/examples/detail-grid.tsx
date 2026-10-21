import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { nestedDetailsConfiguration } from './configs/nestedDetails';

export { nestedDetailsConfiguration as gridConfiguration } from './configs/nestedDetails';

export function NestedDetailsGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={nestedDetailsConfiguration.rows}
      columns={nestedDetailsConfiguration.columns}
      getRowId={nestedDetailsConfiguration.getRowId}
      rowSelectionMode={nestedDetailsConfiguration.rowSelectionMode}
      height={nestedDetailsConfiguration.height}
      detailPanel={nestedDetailsConfiguration.detailPanel}
      {...gridProps}
    />
  );
}
