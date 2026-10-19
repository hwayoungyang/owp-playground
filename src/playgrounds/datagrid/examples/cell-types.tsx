import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import type { Task } from '../model/data';
import { getRowId, initialTasks, owners } from '../model/data';
import type { GridConfiguration, GridViewProps } from '../model/gridTypes';

const cellTypeColumns: readonly OwpDataGridColumn<Task>[] = [
  {
    id: 'task',
    field: 'task',
    header: '텍스트',
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
    header: '셀렉트',
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
    header: '체크박스',
    type: 'boolean',
    minWidth: 90,
    relWidth: 0.7,
    editable: true,
  },
];

const typeColumns = cellTypeColumns;

export const gridConfiguration: GridConfiguration = {
  rows: initialTasks,
  columns: typeColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
};

export function CellTypesGrid(props: GridViewProps = {}) {
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
