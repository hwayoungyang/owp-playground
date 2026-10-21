import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { createElement } from 'react';
import { WorksheetTaskCell } from '../components/WorksheetTaskCell';
import { getRowId } from '../../model/data';
import type { Task } from '../../types';
import { worksheetRows } from '../../model/worksheet-data';
import type { OwpDataGridProps } from '@owp/datagrid/types';

const amount = (row: Task) => row.completed * row.cost;
const appliedAmount = (row: Task) => Math.round((amount(row) * (row.rate ?? 0)) / 100);
export const isItem = (row: Task) => row.worksheetKind === 'item';
const inputNumber = { min: 0, allowNegative: false, maximumFractionDigits: 0 } as const;

const numericColumn = {
  type: 'number',
  minWidth: 130,
  relWidth: 1,
  numberOptions: inputNumber,
} as const;

const columns: readonly OwpDataGridColumn<Task>[] = [
  {
    id: 'project',
    field: 'project',
    header: '프로젝트',
    minWidth: 110,
    relWidth: 1,
    align: 'center',
  },
  {
    id: 'task',
    field: 'task',
    header: '작업',
    minWidth: 150,
    relWidth: 1.5,
    renderCell: ({ row }) => createElement(WorksheetTaskCell, { row }),
  },
  {
    id: 'quantity',
    field: 'quantity',
    header: '계획',
    ...numericColumn,
  },
  {
    id: 'reserved',
    field: 'reserved',
    header: '대기',
    ...numericColumn,
  },
  {
    id: 'remaining',
    header: '남은 수량',
    ...numericColumn,
    valueGetter: (row) => row.quantity - (row.reserved ?? 0) - row.completed,
  },
  {
    id: 'gap',
    header: '계획·완료 수량 차이',
    ...numericColumn,
    valueGetter: (row) => row.quantity - row.completed,
  },
  {
    id: 'completed',
    field: 'completed',
    header: '완료',
    ...numericColumn,
    editable: ({ row }) => isItem(row),
    valueSetter: ({ row, nextValue }) => ({ ...row, completed: Number(nextValue) }),
  },
  {
    id: 'cost',
    field: 'cost',
    header: '단가 (원)',
    ...numericColumn,
    editable: ({ row }) => isItem(row),
    valueSetter: ({ row, nextValue }) => ({ ...row, cost: Number(nextValue) }),
  },
  {
    id: 'amount',
    header: '완료 비용 (원)',
    ...numericColumn,
    valueGetter: amount,
    excel: { numFmt: '#,##0' },
  },
  {
    id: 'rate',
    field: 'rate',
    header: '적용률 (%)',
    ...numericColumn,
    editable: ({ row }) => row.worksheetKind === 'rate',
    numberOptions: { ...inputNumber, max: 100, maximumFractionDigits: 2 },
    valueSetter: ({ row, nextValue }) => ({ ...row, rate: Number(nextValue) }),
  },
  {
    id: 'appliedAmount',
    header: '적용 금액 (원)',
    ...numericColumn,
    valueGetter: appliedAmount,
    excel: { numFmt: '#,##0' },
  },
  {
    id: 'plannedAmount',
    header: '계획 비용 (원)',
    ...numericColumn,
    valueGetter: (row) => row.quantity * row.cost,
    excel: { numFmt: '#,##0' },
  },
];

export const worksheetColumns = columns.map((column): OwpDataGridColumn<Task> => ({
  ...column,
  sortable: false,
  filterable: false,
  resizable: true,
  headerAlign: 'center',
  valueGetter: (row) => {
    if (column.type === 'number' && row.worksheetKind === 'rate' && column.id !== 'rate')
      return undefined;
    if (column.valueGetter) return column.valueGetter(row);
    return column.field ? row[column.field] : undefined;
  },
  cellStyle: (params) => {
    const input = typeof column.editable === 'function' && column.editable(params);
    const linked = column.id === 'rate' && ['task-4', 'task-8'].includes(params.row.id);
    return {
      backgroundColor: input
        ? 'var(--pg-warning-wash)'
        : linked
          ? 'var(--pg-purple-wash)'
          : column.type === 'number'
            ? 'var(--pg-blue-wash)'
            : undefined,
      color: linked ? 'var(--pg-purple)' : undefined,
      fontWeight: linked ? 600 : undefined,
    };
  },
}));

export const taskWorksheetConfiguration: OwpDataGridProps<Task, Task> = {
  rows: worksheetRows,
  columns: worksheetColumns,
  getRowId,
  height: 420,
  rowSelectionMode: 'none',
  layout: {
    columnRegions: [
      { id: 'work', mode: 'fixed', columnIds: ['project', 'task'], width: 260 },
      {
        id: 'calculation',
        mode: 'scroll',
        columnIds: columns.slice(2).map((column) => column.id),
        flex: 1,
      },
    ],
  },
  headerRows: [
    [
      { id: 'work', header: '프로젝트·작업', columnIds: ['project', 'task'] },
      {
        id: 'units',
        header: '작업 수량',
        columnIds: ['quantity', 'reserved', 'remaining', 'gap'],
      },
      {
        id: 'inputs',
        header: '직접 입력',
        columnIds: ['completed', 'cost'],
      },
      {
        id: 'amounts',
        header: '계산 결과',
        columnIds: ['amount', 'rate', 'appliedAmount', 'plannedAmount'],
      },
    ],
    columns.map((column) => ({ columnId: column.id })),
  ],
  getCellRowSpanKey: ({ row, column }) => (column.id === 'project' ? row.project : undefined),
  summaryRows: ['웹 서비스', '모바일 앱'].map((project) => ({
    id: `total-${project}`,
    scope: 'all',
    cells: [
      { columnId: 'project', value: project },
      { columnId: 'task', value: '프로젝트 합계' },
      ...[
        { columnId: 'quantity', getValue: (row: Task) => row.quantity },
        { columnId: 'reserved', getValue: (row: Task) => row.reserved ?? 0 },
        {
          columnId: 'remaining',
          getValue: (row: Task) => row.quantity - (row.reserved ?? 0) - row.completed,
        },
        { columnId: 'gap', getValue: (row: Task) => row.quantity - row.completed },
        { columnId: 'completed', getValue: (row: Task) => row.completed },
        { columnId: 'amount', getValue: amount },
        { columnId: 'appliedAmount', getValue: appliedAmount },
        { columnId: 'plannedAmount', getValue: (row: Task) => row.quantity * row.cost },
      ].map(({ columnId, getValue }) => ({
        columnId,
        valueGetter: ({ rows }: { readonly rows: readonly Task[] }) =>
          rows
            .filter((row) => isItem(row) && row.project === project)
            .reduce((total, row) => total + getValue(row), 0),
      })),
    ],
  })),
};

export const worksheetCompactLayout = {
  columnRegions: [
    { id: 'work', mode: 'fixed', columnIds: ['project'], width: 110 },
    {
      id: 'calculation',
      mode: 'scroll',
      columnIds: columns.slice(1).map((column) => column.id),
      flex: 1,
    },
  ],
} satisfies NonNullable<OwpDataGridProps<Task, Task>['layout']>;

export const worksheetSummarySx = {
  '& .OwpDataGrid-summary > [role="row"]': {
    bgcolor: 'var(--pg-success-wash)',
    color: 'var(--pg-success)',
  },
} satisfies OwpDataGridProps<Task, Task>['sx'];
