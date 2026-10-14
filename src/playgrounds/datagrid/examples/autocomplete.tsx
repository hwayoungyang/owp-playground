import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import type { Task } from '../model/data';
import { getRowId, initialTasks, owners } from '../model/data';
import type { Definition, ExampleProps } from '../model/types';

const columns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 175, relWidth: 1.4 },
  { id: 'task', field: 'task', header: '작업', minWidth: 175, relWidth: 1.5 },
  {
    id: 'owner',
    field: 'owner',
    header: '담당자 검색',
    minWidth: 170,
    relWidth: 1.4,
    align: 'center',
    headerAlign: 'center',
    type: 'select',
    editable: true,
    autocompleteOptions: {},
    getValueOptions: () => owners.map((value) => ({ value, label: value })),
  },
] satisfies OwpDataGridColumn<Task>[];

export const exampleDefinition: Definition = {
  rows: initialTasks,
  columns,
  getRowId,
  rowSelectionMode: 'none',
  height: 420,
};

export function OwpDataGridExample(props: ExampleProps = {}) {
  const { gridRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={exampleDefinition.rows}
      columns={exampleDefinition.columns}
      getRowId={exampleDefinition.getRowId}
      rowSelectionMode={exampleDefinition.rowSelectionMode}
      height={exampleDefinition.height}
      {...gridProps}
    />
  );
}
