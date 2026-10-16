import { MenuItem, Select } from '@mui/material';
import { OwpDataGrid, OwpDataGridExportExcelButton } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridHeaderRow, OwpDataGridRef } from '@owp/datagrid/types';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, owners, statuses } from '../model/data';
import type { GridConfiguration, GridViewProps } from '../model/gridTypes';

const statusClasses: Readonly<Record<string, string>> = {
  '진행 중': 'status-0',
  완료: 'status-1',
  '검토 중': 'status-2',
  대기: 'status-3',
};

const baseColumns = [
  { id: 'project', field: 'project', header: '프로젝트', minWidth: 175, relWidth: 1.4 },
  { id: 'task', field: 'task', header: '작업', minWidth: 175, relWidth: 1.5 },
  { id: 'owner', field: 'owner', header: '담당자', minWidth: 100, relWidth: 0.8, align: 'center' },
  {
    id: 'status',
    field: 'status',
    header: '상태',
    minWidth: 110,
    relWidth: 0.9,
    align: 'center',
    headerAlign: 'center',
    type: 'select',
    valueOptions: statuses.map((value) => ({ value, label: value })),
    renderCell: ({ row }) =>
      row.status ? (
        <span className={`status-badge ${statusClasses[row.status] ?? ''}`}>
          <span className="status-dot" />
          {translate(row.status)}
        </span>
      ) : null,
  },
  {
    id: 'quantity',
    field: 'quantity',
    header: '계획',
    type: 'number',
    minWidth: 80,
    relWidth: 0.6,
    numberOptions: { maximumFractionDigits: 0 },
  },
  {
    id: 'completed',
    field: 'completed',
    header: '완료',
    type: 'number',
    minWidth: 80,
    relWidth: 0.6,
    numberOptions: { maximumFractionDigits: 0 },
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

const editableColumns = baseColumns.map((column) => ({
  ...column,
  resizable: true,
  headerAlign: ['status', 'date', 'time', 'datetime'].includes(column.id)
    ? ('center' as const)
    : ('left' as const),
  editable: column.id !== 'project',
  ...(column.id === 'owner'
    ? { type: 'select' as const, valueOptions: owners.map((value) => ({ value, label: value })) }
    : {}),
}));

const groupedHeaders: readonly OwpDataGridHeaderRow[] = [
  [
    { columnId: 'project', rowSpan: 2 },
    { id: 'work', header: '작업 정보', columnIds: ['task', 'owner', 'status'] },
    { id: 'delivery', header: '진행 현황', columnIds: ['quantity', 'completed', 'date'] },
  ],
  baseColumns.slice(1).map((column) => ({ columnId: column.id })),
];

const overviewSummary: GridConfiguration['summaryRows'] = [
  {
    id: 'total',
    cells: [
      { columnId: 'project', value: '전체 합계' },
      { columnId: 'quantity', aggregate: 'sum' },
      { columnId: 'completed', aggregate: 'sum' },
    ],
  },
];

export const gridConfiguration: GridConfiguration = {
  rows: initialTasks,
  columns: editableColumns.map((column) => ({
    ...column,
    excel: column.id === 'quantity' ? { numFmt: '#,##0' } : {},
  })),
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  headerRows: groupedHeaders,
  summaryRows: overviewSummary,
};

const scopeSchema = z.enum(['visible', 'all', 'selected']);
export function ExcelExportGrid(props: GridViewProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [scope, setScope] = useState<z.infer<typeof scopeSchema>>('visible');
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <Select
          value={scope}
          onChange={(event) => {
            const parsed = scopeSchema.safeParse(event.target.value);
            if (parsed.success) setScope(parsed.data);
          }}
          inputProps={{ 'aria-label': translate('Excel 내보내기 범위') }}
        >
          <MenuItem value="visible">{translate('현재 표시 행')}</MenuItem>
          <MenuItem value="all">{translate('전체 행')}</MenuItem>
          <MenuItem value="selected">{translate('선택 행')}</MenuItem>
        </Select>
        <OwpDataGridExportExcelButton
          dataGridRef={gridRef}
          scope={scope}
          exportName="OWP_excel"
          saveMode="download"
          variant="outlined"
          startIcon={<DownloadSimpleIcon size={15} />}
        >
          Excel
        </OwpDataGridExportExcelButton>
      </div>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={initialTasks}
          columns={gridConfiguration.columns}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          headerRows={groupedHeaders}
          summaryRows={overviewSummary}
          {...gridProps}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
