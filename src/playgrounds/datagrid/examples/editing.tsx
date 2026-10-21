import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { taskEditingConfiguration } from './configs/taskEditing';

export { taskEditingConfiguration as gridConfiguration } from './configs/taskEditing';

export function EditableCellsGrid({
  api: suppliedApi,
  callbacks,
  ...gridProps
}: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={taskEditingConfiguration.rows}
      columns={taskEditingConfiguration.columns}
      getRowId={taskEditingConfiguration.getRowId}
      rowSelectionMode="multiple"
      height={420}
      enterKeyAction="nextEditableCell"
      {...gridProps}
    />
  );
}
