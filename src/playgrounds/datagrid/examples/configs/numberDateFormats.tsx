import type { OwpDataGridProps } from '@owp/datagrid/types';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import type { Task } from '../../types';
import { getRowId, initialTasks } from '../../model/data';

export const numberDateFormatsFractionDigits = [1, 2, 3, 4, 5, 6] as const;

export const numberDateFormatsColumns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 120, relWidth: 1.2 },
  { id: 'task', field: 'task', header: '작업', minWidth: 150, relWidth: 1.3 },
  {
    id: 'cost',
    field: 'cost',
    header: '금액 (원)',
    type: 'number',
    minWidth: 110,
    relWidth: 1,
    editable: true,
    numberOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    excel: { numFmt: '#,##0.00' },
  },
  {
    id: 'date',
    field: 'date',
    header: '날짜',
    type: 'date',
    minWidth: 140,
    relWidth: 1.2,
    editable: true,
    align: 'center',
    headerAlign: 'center',
    dateOptions: { format: 'YYYY-MM-DD' },
  },
  {
    id: 'year',
    field: 'year',
    header: '연도',
    type: 'date',
    minWidth: 100,
    relWidth: 0.8,
    editable: true,
    align: 'center',
    headerAlign: 'center',
    dateOptions: { format: 'YYYY' },
    excel: { numFmt: 'yyyy' },
  },
  {
    id: 'month',
    field: 'month',
    header: '연월',
    type: 'date',
    minWidth: 120,
    relWidth: 1,
    editable: true,
    align: 'center',
    headerAlign: 'center',
    dateOptions: { format: 'YYYY-MM' },
    excel: { numFmt: 'yyyy-mm' },
  },
  {
    id: 'time',
    field: 'time',
    header: '시간',
    type: 'time',
    minWidth: 110,
    relWidth: 1,
    editable: true,
    align: 'center',
    headerAlign: 'center',
    timeOptions: { format: 'HH:mm:ss' },
  },
  {
    id: 'datetime',
    field: 'datetime',
    header: '일시',
    type: 'datetime',
    minWidth: 200,
    relWidth: 1.8,
    editable: true,
    align: 'center',
    headerAlign: 'center',
    datetimeOptions: { format: 'YYYY-MM-DD HH:mm:ss' },
  },
] satisfies OwpDataGridColumn<Task>[];

export const numberDateFormatsConfiguration: OwpDataGridProps<Task, Task> = {
  rows: initialTasks.map((row) => ({
    ...row,
    time: `${row.time}:00`,
    datetime: `${row.datetime}:00`,
  })),
  columns: numberDateFormatsColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
};
