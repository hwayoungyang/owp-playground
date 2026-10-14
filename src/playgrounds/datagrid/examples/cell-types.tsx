import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import type { Task } from '../model/data';
import { getRowId, initialTasks, owners } from '../model/data';
import type { Definition, ExampleProps } from '../model/types';

const cellTypeColumns: readonly OwpDataGridColumn<Task>[] = [
  {
    id: 'task',
    field: 'task',
    header: '문자',
    minWidth: 180,
    relWidth: 1.5,
    editable: true,
    required: true,
  },
  {
    id: 'quantity',
    field: 'quantity',
    header: '숫자',
    type: 'number',
    minWidth: 100,
    relWidth: 0.8,
    editable: true,
  },
  {
    id: 'owner',
    field: 'owner',
    header: '선택 값',
    type: 'select',
    minWidth: 110,
    relWidth: 0.9,
    editable: true,
    valueOptions: owners.map((value) => ({ value, label: value })),
  },
  {
    id: 'search-owner',
    field: 'owner',
    header: '자동완성',
    type: 'select',
    minWidth: 150,
    relWidth: 1.2,
    editable: true,
    autocompleteOptions: {},
    valueOptions: owners.map((value) => ({ value, label: value })),
  },
  {
    id: 'date',
    field: 'date',
    header: '날짜',
    type: 'date',
    minWidth: 150,
    relWidth: 1.2,
    editable: true,
    align: 'center',
    headerAlign: 'center',
    dateOptions: { format: 'YYYY-MM-DD' },
  },
  {
    id: 'time',
    field: 'time',
    header: '시간',
    type: 'time',
    minWidth: 120,
    relWidth: 1,
    editable: true,
    align: 'center',
    headerAlign: 'center',
  },
  {
    id: 'datetime',
    field: 'datetime',
    header: '일시',
    type: 'datetime',
    minWidth: 200,
    relWidth: 1.6,
    editable: true,
    align: 'center',
    headerAlign: 'center',
  },
  {
    id: 'active',
    field: 'active',
    header: '체크',
    type: 'boolean',
    minWidth: 90,
    relWidth: 0.7,
    editable: true,
  },
];

const typeColumns = cellTypeColumns;

export const exampleDefinition: Definition = {
  rows: initialTasks,
  columns: typeColumns,
  getRowId,
  rowSelectionMode: 'multiple',
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
