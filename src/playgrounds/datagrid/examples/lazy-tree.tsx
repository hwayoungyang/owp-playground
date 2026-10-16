import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { createTree, getRowId, initialTasks, owners, statuses } from '../model/data';
import type { GridConfiguration, GridViewProps } from '../model/gridTypes';
import { loadRows } from '../model/server';

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
  rows: createTree().filter((row) => row.parentId === null),
  columns: editableColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  treeOptions: {
    mode: 'parent-reference',
    getParentRowId: (row) => row.parentId,
    getRowCanExpand: (row) => row.parentId === null,
    lazyChildren: {
      loadChildren: ({ row, signal }) =>
        loadRows(
          initialTasks
            .filter((task) => task.project === row.project)
            .map((task) => ({ ...task, parentId: row.id })),
          signal,
        ),
    },
    filterFromLeafRows: true,
  },
  rowSelectionPropagation: { descendants: true, parents: false },
};
export function LazyTreeGrid(props: GridViewProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const publish = (api: string, value: unknown) => {
    onRecord?.(api, value);
  };
  const target = selected[0] ?? 'project-0';
  const load = async () => {
    const success = await gridRef.current?.loadChildren(target);
    publish('loadChildren', success);
  };
  const reload = async () => {
    const success = await gridRef.current?.reloadChildren(target);
    publish('reloadChildren', success);
  };
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <Button onClick={() => void load()}>{translate('하위 행 불러오기')}</Button>
        <Button onClick={() => void reload()}>{translate('하위 행 다시 불러오기')}</Button>
        <Button
          onClick={() =>
            publish('getChildrenLoadState', gridRef.current?.getChildrenLoadState(target))
          }
        >
          {translate('조회 상태')}
        </Button>
        <Button onClick={() => gridRef.current?.expandRow(target)}>
          {translate('선택 행 펼치기')}
        </Button>
        <Button onClick={() => gridRef.current?.collapseRow(target)}>
          {translate('선택 행 접기')}
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
          treeOptions={gridConfiguration.treeOptions}
          rowSelectionPropagation={gridConfiguration.rowSelectionPropagation}
          {...gridProps}
          rowSelectionModel={selected}
          onRowSelectionModelChange={(next) => {
            setSelection(next);
            gridProps.onRowSelectionModelChange?.(next);
          }}
        />
      </div>
    </div>
  );
}
