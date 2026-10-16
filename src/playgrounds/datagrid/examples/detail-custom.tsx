import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
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

function loadRows(rows: readonly Task[], signal: AbortSignal): Promise<readonly Task[]> {
  return new Promise((resolve) => {
    const finish = (result: readonly Task[]) => {
      signal.removeEventListener('abort', abort);
      resolve(result);
    };
    const timer = setTimeout(() => finish(rows), 350);
    const abort = () => {
      clearTimeout(timer);
      finish([]);
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}

export const gridConfiguration: GridConfiguration = {
  rows: initialTasks.filter((_, index) => index % 4 === 0),
  columns: baseColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  detailPanel: {
    height: 260,
    loadRows: ({ row, signal }) =>
      loadRows(
        initialTasks.filter((task) => task.project === row.project),
        signal,
      ),
    renderDetail: ({ row, rows, loading }) => (
      <div className="project-detail">
        <div>
          <span className="eyebrow">{translate('프로젝트 요약')}</span>
          <h3>{row.project}</h3>
          <p>
            {loading
              ? translate('프로젝트를 불러오는 중…')
              : translate('{{count}}개 작업 · 담당 {{owner}}', {
                  count: rows.length,
                  owner: row.owner,
                })}
          </p>
        </div>
        <div className="project-progress">
          <span className="eyebrow">{translate('작업 현황')}</span>
          <dl>
            {[
              { label: '계획', value: rows.reduce((total, item) => total + item.quantity, 0) },
              { label: '완료', value: rows.reduce((total, item) => total + item.completed, 0) },
              {
                label: '남은 수량',
                value: rows.reduce(
                  (total, item) => total + Math.max(0, item.quantity - item.completed),
                  0,
                ),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt>{translate(label)}</dt>
                <dd>{loading ? '—' : value}</dd>
              </div>
            ))}
          </dl>
          <p>
            {translate('다음 마감일')} · {row.date}
          </p>
          <span className="project-progress-note">
            {translate('남은 작업량과 다음 마감일을 함께 표시합니다.')}
          </span>
        </div>
        <div
          className="weekly-chart"
          role="img"
          aria-label={translate('월~금 완료 수량: 12, 28, 21, 36, 32')}
        >
          <span>{translate('주간 완료 수량')}</span>
          <div>
            {[12, 28, 21, 36, 32].map((value, index) => (
              <div key={value}>
                <i style={{ height: `${value * 2}px` }} />
                <span>{translate(['월', '화', '수', '목', '금'][index] ?? '')}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
};

export function ProjectDetailsGrid(props: GridViewProps = {}) {
  const { gridRef, onRecord, onRowsChange, onBusyChange, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={gridConfiguration.rows}
      columns={gridConfiguration.columns}
      getRowId={gridConfiguration.getRowId}
      rowSelectionMode={gridConfiguration.rowSelectionMode}
      height={gridConfiguration.height}
      detailPanel={gridConfiguration.detailPanel}
      {...gridProps}
    />
  );
}
