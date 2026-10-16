import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { createNestedTree, getRowId, owners, statuses } from '../model/data';
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

export const gridConfiguration: GridConfiguration = {
  rows: createNestedTree(),
  columns: editableColumns,
  getRowId,
  height: 420,
  rowSelectionMode: 'multiple',
  treeOptions: {
    mode: 'nested',
    getChildren: (row) => row.children,
    defaultExpansionModel: ['project-0', 'phase-0-0', 'work-0-0-0'],
    filterFromLeafRows: true,
    indentation: 20,
  },
  rowSelectionPropagation: { descendants: true, parents: true },
  layout: { filterRow: true },
};
export function NestedTaskTreeGrid(props: GridViewProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [expanded, setExpanded] = useState<readonly OwpDataGridRowId[]>([
    'project-0',
    'phase-0-0',
    'work-0-0-0',
  ]);
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <Button onClick={() => gridRef.current?.expandAll()}>{translate('전체 펼치기')}</Button>
        <Button onClick={() => gridRef.current?.collapseAll()}>{translate('전체 접기')}</Button>
        <Button onClick={() => gridRef.current?.expandRow('project-0')}>
          {translate('첫 프로젝트 펼치기')}
        </Button>
        <Button onClick={() => gridRef.current?.collapseRow('project-0')}>
          {translate('첫 프로젝트 접기')}
        </Button>
      </div>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={gridConfiguration.rows}
          columns={editableColumns}
          getRowId={getRowId}
          style={{ height: '100%' }}
          rowSelectionMode="multiple"
          rowSelectionPropagation={{ descendants: true, parents: true }}
          layout={{ filterRow: true }}
          {...gridProps}
          treeOptions={{
            mode: 'nested',
            getChildren: (row) => row.children,
            filterFromLeafRows: true,
            indentation: 20,
            expansionModel: expanded,
            onExpansionModelChange: (next) => {
              setExpanded(next);
              onRecord?.('expansion', next);
            },
          }}
        />
      </div>
    </div>
  );
}
