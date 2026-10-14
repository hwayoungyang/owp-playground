import { MenuItem, Select } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { useEffect, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../model/data';
import { getRowId, initialTasks, statuses } from '../model/data';
import type { Definition, ExampleProps } from '../model/types';

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

export const exampleDefinition: Definition = {
  rows: initialTasks,
  columns: baseColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  radius: 0.25,
};

export function OwpDataGridExample(props: ExampleProps = {}) {
  const { gridRef, onRecord, onRowsChange, onBusyChange, onRadiusChange, ...gridProps } = props;
  const [radius, setRadius] = useState(0.25);
  useEffect(() => {
    if (typeof gridProps.radius === 'number') setRadius(gridProps.radius);
  }, [gridProps.radius]);
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls">
        <span>{translate('모서리 둥글기')}</span>
        <Select
          value={radius}
          inputProps={{ 'aria-label': translate('모서리 둥글기') }}
          onChange={(event) => {
            const next = Number(event.target.value);
            if ([0, 0.25, 0.5, 0.75].includes(next)) {
              setRadius(next);
              onRadiusChange?.(next);
              onRecord?.('radius', next);
            }
          }}
        >
          <MenuItem value={0}>{translate('기본 (각진)')}</MenuItem>
          <MenuItem value={0.25}>{translate('작게')}</MenuItem>
          <MenuItem value={0.5}>{translate('중간')}</MenuItem>
          <MenuItem value={0.75}>{translate('크게')}</MenuItem>
        </Select>
      </div>
      <div className="example-grid" style={{ padding: 12 }}>
        <OwpDataGrid
          ref={gridRef}
          rows={exampleDefinition.rows}
          columns={baseColumns}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          style={{ height: '100%' }}
          {...gridProps}
          radius={radius}
        />
      </div>
    </div>
  );
}
