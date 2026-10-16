import { MenuItem, Select } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { Task } from '../model/data';
import { getRowId, initialTasks } from '../model/data';
import type { Definition, ExampleProps } from '../model/types';

const fractionDigits = [1, 2, 3, 4, 5, 6] as const;
const fractionDigitsSchema = z.coerce.number().int().min(1).max(6);

const columns = [
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

export const exampleDefinition: Definition = {
  rows: initialTasks.map((row) => ({
    ...row,
    time: `${row.time}:00`,
    datetime: `${row.datetime}:00`,
  })),
  columns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
};

export function OwpDataGridExample(props: ExampleProps = {}) {
  const { gridRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const { t } = useTranslation('app');
  const [precision, setPrecision] = useState(2);
  const currentColumns = useMemo(
    () =>
      (gridProps.columns ?? columns).map((column) =>
        column.id === 'cost'
          ? {
              ...column,
              numberOptions: {
                ...column.numberOptions,
                minimumFractionDigits: precision,
                maximumFractionDigits: precision,
              },
              excel: { ...column.excel, numFmt: `#,##0.${'0'.repeat(precision)}` },
            }
          : column,
      ),
    [gridProps.columns, precision],
  );
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <label htmlFor="amount-precision">{t('금액 소수 자릿수')}</label>
        <Select
          id="amount-precision"
          value={precision}
          inputProps={{ 'aria-label': t('금액 소수 자릿수') }}
          onChange={(event) => {
            const result = fractionDigitsSchema.safeParse(event.target.value);
            if (result.success) setPrecision(result.data);
          }}
        >
          {fractionDigits.map((digits) => (
            <MenuItem key={digits} value={digits}>
              {digits}
            </MenuItem>
          ))}
        </Select>
      </div>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={exampleDefinition.rows}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          height={420}
          {...gridProps}
          columns={currentColumns}
          style={{ ...gridProps.style, height: '100%' }}
        />
      </div>
    </div>
  );
}
