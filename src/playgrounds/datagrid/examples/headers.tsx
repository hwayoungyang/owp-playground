import { useOwpTranslation } from '@owp/components/hooks';
import { FormControlLabel, Switch } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridHeaderRow } from '@owp/datagrid/types';
import { useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, statuses } from '../model/data';
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

const groupedHeaders: readonly OwpDataGridHeaderRow[] = [
  [
    { columnId: 'project', rowSpan: 2 },
    { id: 'work', header: '작업 정보', columnIds: ['task', 'owner', 'status'] },
    { id: 'delivery', header: '진행 현황', columnIds: ['quantity', 'completed', 'date'] },
  ],
  baseColumns.slice(1).map((column) => ({ columnId: column.id })),
];

export const gridConfiguration: GridConfiguration = {
  rows: initialTasks,
  columns: baseColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  headerRows: groupedHeaders,
  hideChildHeaderSortButtons: false,
};

export function GroupedHeadersGrid(props: GridViewProps = {}) {
  const { t } = useOwpTranslation();
  const [showChildSorting, setShowChildSorting] = useState(true);
  const { gridRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showChildSorting}
              onChange={(_, checked) => setShowChildSorting(checked)}
            />
          }
          label={t('하위 컬럼 정렬 버튼 표시')}
        />
      </div>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={initialTasks}
          columns={baseColumns}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          height="100%"
          headerRows={groupedHeaders}
          {...gridProps}
          hideChildHeaderSortButtons={!showChildSorting}
        />
      </div>
    </div>
  );
}
