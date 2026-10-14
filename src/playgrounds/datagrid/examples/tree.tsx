import { Button, MenuItem, Select } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridRef } from '@owp/datagrid/types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { createTree, getRowId, initialTasks, statuses } from '../model/data';
import { loadRows } from '../model/server';
import type { Definition, ExampleProps } from '../model/types';

const treeRows = createTree();

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

const treeOptions: Definition['treeOptions'] = {
  mode: 'parent-reference',
  getParentRowId: (row) => row.parentId,
  defaultExpansionModel: treeRows.filter((row) => row.parentId === null).map(getRowId),
};

export const exampleDefinition: Definition = {
  rows: treeRows,
  columns: baseColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  treeOptions,
  rowReordering: { dragMode: 'selected' },
  rowSelectionPropagation: { descendants: true, parents: true },
};

export function OwpDataGridExample(props: ExampleProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [lazy, setLazy] = useState(false);
  const rows = useMemo(
    () => (lazy ? treeRows.filter((row) => row.parentId === null) : treeRows),
    [lazy],
  );
  useEffect(() => {
    onRowsChange?.(rows);
  }, [rows, onRowsChange]);
  const options = useMemo<Definition['treeOptions']>(
    () =>
      lazy
        ? {
            mode: 'parent-reference',
            getParentRowId: (row) => row.parentId,
            getRowCanExpand: (row) => row.parentId === null,
            lazyChildren: {
              loadChildren: async ({ row, signal }) => {
                const children = await loadRows(
                  initialTasks
                    .filter((task) => task.project === row.project)
                    .map((task) => ({ ...task, parentId: row.id })),
                  signal,
                );
                onRecord?.('tree.loadChildren', { rowId: row.id, count: children.length });
                requestAnimationFrame(() => {
                  if (!signal.aborted) onRowsChange?.(gridRef.current?.getRows() ?? []);
                });
                return children;
              },
            },
          }
        : {
            mode: 'parent-reference',
            getParentRowId: (row) => row.parentId,
            defaultExpansionModel: treeRows.filter((row) => row.parentId === null).map(getRowId),
          },
    [lazy, onRecord, onRowsChange, gridRef],
  );
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <span>{translate('하위 데이터')}</span>
        <Select
          value={lazy ? 'lazy' : 'all'}
          inputProps={{ 'aria-label': translate('하위 데이터') }}
          onChange={(event) => {
            setLazy(event.target.value === 'lazy');
            gridProps.onRowSelectionModelChange?.([]);
          }}
        >
          <MenuItem value="all">{translate('미리 불러오기')}</MenuItem>
          <MenuItem value="lazy">{translate('펼칠 때 불러오기')}</MenuItem>
        </Select>
        <Button onClick={() => gridRef.current?.expandAll()}>{translate('전체 펼치기')}</Button>
        <Button onClick={() => gridRef.current?.collapseAll()}>{translate('전체 접기')}</Button>
      </div>
      <div className="example-grid">
        <OwpDataGrid
          key={String(lazy)}
          ref={gridRef}
          columns={baseColumns}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          rowSelectionPropagation={{ descendants: true, parents: true }}
          {...gridProps}
          rows={rows}
          treeOptions={options}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
