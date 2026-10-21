import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { autocompleteEditorsConfiguration } from './configs/autocompleteEditors';

export { autocompleteEditorsConfiguration as gridConfiguration } from './configs/autocompleteEditors';

export function AutocompleteGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={autocompleteEditorsConfiguration.rows}
      columns={autocompleteEditorsConfiguration.columns}
      getRowId={autocompleteEditorsConfiguration.getRowId}
      rowSelectionMode={autocompleteEditorsConfiguration.rowSelectionMode}
      height={autocompleteEditorsConfiguration.height}
      {...gridProps}
    />
  );
}
