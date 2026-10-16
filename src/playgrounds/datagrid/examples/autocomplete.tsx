import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import type { Task } from '../model/data';
import { getRowId, initialTasks, owners } from '../model/data';
import type { GridConfiguration, GridViewProps } from '../model/gridTypes';

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

export const gridConfiguration: GridConfiguration = {
  rows: initialTasks,
  columns,
  getRowId,
  rowSelectionMode: 'none',
  height: 420,
};

export function AutocompleteGrid(props: GridViewProps = {}) {
  const { gridRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={gridConfiguration.rows}
      columns={gridConfiguration.columns}
      getRowId={gridConfiguration.getRowId}
      rowSelectionMode={gridConfiguration.rowSelectionMode}
      height={gridConfiguration.height}
      {...gridProps}
    />
  );
}
