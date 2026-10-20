import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { taskEditingConfiguration } from './configs/taskEditing';

export { taskEditingConfiguration as gridConfiguration } from './configs/taskEditing';

export function EditableCellsGrid({ gridRef, ...gridProps }: TaskGridProps = {}) {
  return (
    <OwpDataGrid
      ref={gridRef}
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
