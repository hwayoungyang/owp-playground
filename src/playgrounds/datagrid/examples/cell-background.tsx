import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import type { Task } from '../model/data';
import { getRowId, initialTasks } from '../model/data';
import type { Definition, ExampleProps } from '../model/types';

const columns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 150, relWidth: 1.2 },
  { id: 'task', field: 'task', header: '작업', minWidth: 180, relWidth: 1.5 },
  { id: 'status', field: 'status', header: '상태', minWidth: 110, relWidth: 0.9, align: 'center' },
  {
    id: 'quantity',
    field: 'quantity',
    header: '계획',
    type: 'number',
    minWidth: 100,
    relWidth: 0.8,
  },
  {
    id: 'completed',
    field: 'completed',
    header: '완료',
    type: 'number',
    minWidth: 100,
    relWidth: 0.8,
    cellStyle: ({ row }) =>
      row.completed === row.quantity
        ? { backgroundColor: 'var(--pg-blue-wash)', color: 'var(--pg-blue)' }
        : { backgroundColor: 'var(--pg-purple-wash)', color: 'var(--pg-purple)' },
  },
  {
    id: 'date',
    field: 'date',
    header: '마감일',
    type: 'date',
    minWidth: 150,
    relWidth: 1.1,
    align: 'center',
    headerAlign: 'center',
    dateOptions: { format: 'YYYY-MM-DD' },
  },
] satisfies OwpDataGridColumn<Task>[];

export const exampleDefinition: Definition = {
  rows: initialTasks,
  columns,
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
      columns={columns}
      getRowId={getRowId}
      rowSelectionMode="multiple"
      height={420}
      {...gridProps}
    />
  );
}
