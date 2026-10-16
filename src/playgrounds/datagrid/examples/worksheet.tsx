// allow: SIZE_OK — 컬럼·레이아웃·집계·Ref 연동을 실행 원본 스니펫 하나에서 확인하는 예제입니다.
import { useMediaQuery } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn, OwpDataGridRef } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { getRowId, type Task } from '../model/data';
import type { GridConfiguration, GridViewProps } from '../model/gridTypes';
import { worksheetRows } from '../model/worksheet-data';

const amount = (row: Task) => row.completed * row.cost;
const appliedAmount = (row: Task) => Math.round((amount(row) * (row.rate ?? 0)) / 100);
const isItem = (row: Task) => row.worksheetKind === 'item';
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
    renderCell: ({ row }) => translate(row.worksheetKind === 'rate' ? '기본 적용률' : row.task),
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

const worksheetColumns = columns.map(
  (column): OwpDataGridColumn<Task> => ({
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
  }),
);

export const gridConfiguration: GridConfiguration = {
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

export function CalculatedCellsGrid(props: GridViewProps = {}) {
  const compact = useMediaQuery('(max-width:599px)');
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  const [update, setUpdate] = useState({
    message: '',
    project: '',
    task: '',
  });
  const [error, setError] = useState(false);
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <div className="example-controls worksheet-legend">
        {(['입력', '계산', '연동', '합계'] as const).map((label, index) => (
          <span key={label} className="worksheet-legend-item">
            <span
              className="worksheet-legend-swatch"
              style={{
                backgroundColor: [
                  'var(--pg-warning-wash)',
                  'var(--pg-blue-wash)',
                  'var(--pg-purple-wash)',
                  'var(--pg-success-wash)',
                ][index],
              }}
              aria-hidden="true"
            />
            {translate(label)}
          </span>
        ))}
      </div>
      <p className="example-caption">
        <span>{translate('기본 적용률 → 프로젝트 전체')}</span>
        {' · '}
        <span>{translate('작업 3 → 작업 4 → 다음 프로젝트')}</span>
      </p>
      {(error || update.message) && (
        <output className="example-caption" role={error ? 'alert' : 'status'}>
          {error
            ? translate('연동 값을 반영하지 못했습니다. 예제를 초기화한 뒤 다시 입력해 주세요.')
            : translate(update.message, {
                project: translate(update.project),
                task: translate(update.task),
              })}
        </output>
      )}
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={worksheetRows}
          columns={worksheetColumns}
          getRowId={getRowId}
          rowSelectionMode="none"
          style={{ height: '100%' }}
          getCellRowSpanKey={gridConfiguration.getCellRowSpanKey}
          summaryRows={gridConfiguration.summaryRows}
          {...gridProps}
          sx={{
            '& .OwpDataGrid-summary > [role="row"]': {
              bgcolor: 'var(--pg-success-wash)',
              color: 'var(--pg-success)',
            },
          }}
          headerRows={compact ? undefined : (gridProps.headerRows ?? gridConfiguration.headerRows)}
          layout={
            compact
              ? {
                  ...gridProps.layout,
                  columnRegions: [
                    { id: 'work', mode: 'fixed', columnIds: ['project'], width: 110 },
                    {
                      id: 'calculation',
                      mode: 'scroll',
                      columnIds: columns.slice(1).map((column) => column.id),
                      flex: 1,
                    },
                  ],
                }
              : (gridProps.layout ?? gridConfiguration.layout)
          }
          onCellValueCommit={(params) => {
            const grid = gridRef.current;
            if (!grid) return;
            if (!['completed', 'cost', 'rate'].includes(params.column.id)) {
              gridProps.onCellValueCommit?.(params);
              return;
            }
            const allRows = grid.getRows();
            const upperTask4 = allRows.find((row) => row.id === 'task-4');
            const upperChanged = params.rowId === 'task-4' && params.column.id === 'completed';
            for (const project of ['웹 서비스', '모바일 앱']) {
              const group = allRows.filter((row) => row.project === project);
              const control = group.find((row) => row.worksheetKind === 'rate');
              const source = group.find((row) => ['task-3', 'task-7'].includes(row.id));
              if (!control || !source) continue;
              const sameProject = params.row.project === project;
              const rateChanged =
                sameProject && params.row.worksheetKind === 'rate' && params.column.id === 'rate';
              const sourceChanged =
                sameProject && params.rowId === source.id && params.column.id === 'completed';
              if (!rateChanged && !sourceChanged && !(upperChanged && project === '모바일 앱'))
                continue;
              const baseRate = control.rate ?? 0;
              const upstream = project === '모바일 앱' ? (upperTask4?.completed ?? 40) : 40;
              const adjustment = (source.completed - 60 + upstream - 40) * 0.1;
              const linkedRate =
                Math.round(Math.max(0, Math.min(100, baseRate - adjustment)) * 100) / 100;
              for (const target of group.filter(isItem)) {
                const linked = ['task-4', 'task-8'].includes(target.id);
                if (!rateChanged && !linked) continue;
                const rate = linked ? linkedRate : baseRate;
                if (target.rate !== rate && !grid.setCellValue(target.id, 'rate', rate)) {
                  setError(true);
                  gridProps.onCellValueCommit?.(params);
                  return;
                }
              }
            }
            setError(false);
            setUpdate({
              project: params.row.project,
              task: params.row.task,
              message:
                params.row.worksheetKind === 'rate'
                  ? '{{project}} 기본 적용률 변경 → 프로젝트 전체의 적용 금액을 반영했습니다.'
                  : ['task-3', 'task-7'].includes(String(params.rowId)) &&
                      params.column.id === 'completed'
                    ? '{{project}} 작업 3 완료 수량 변경 → 작업 4 적용률과 적용 금액을 반영했습니다.'
                    : upperChanged
                      ? '웹 서비스 작업 4 완료 수량 변경 → 모바일 앱 작업 4 적용률과 적용 금액을 반영했습니다.'
                      : '{{project}} {{task}} 변경 → 계산 결과와 프로젝트 합계를 반영했습니다.',
            });
            onRecord?.('worksheet.link', { rowId: params.rowId, columnId: params.column.id });
            gridProps.onCellValueCommit?.(params);
          }}
        />
      </div>
    </div>
  );
}
