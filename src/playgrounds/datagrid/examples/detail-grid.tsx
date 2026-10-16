import { OwpDataGrid, OwpDataGridExportExcelButton } from '@owp/datagrid';
import type {
  OwpDataGridColumn,
  OwpDataGridDetailRenderParams,
  OwpDataGridRef,
} from '@owp/datagrid/types';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
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

function DetailGrid({
  row,
  rows,
  loading,
  error,
  retry,
}: OwpDataGridDetailRenderParams<Task, Task>) {
  const gridRef = useRef<OwpDataGridRef<Task>>(null);
  const { t } = useTranslation('app');
  const columns = baseColumns.slice(1).map((column) => ({
    ...column,
    header: t(column.header),
    valueOptions: column.valueOptions?.map((option) => ({ ...option, label: t(option.label) })),
  }));
  return (
    <div className="detail-grid-content">
      <div className="detail-grid-toolbar">
        <span>
          {row.project} · {t('작업')}
        </span>
        <OwpDataGridExportExcelButton
          dataGridRef={gridRef}
          exportName={`OWP_detail_${row.id}`}
          scope="all"
          saveMode="download"
          disabled={loading || Boolean(error)}
          variant="outlined"
          startIcon={<DownloadSimpleIcon size={15} />}
          aria-label={t('상세 Excel 다운로드')}
        >
          Excel
        </OwpDataGridExportExcelButton>
      </div>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={rows}
          columns={columns}
          getRowId={getRowId}
          style={{ height: '100%' }}
          rowSelectionMode="none"
          loading={loading}
          summaryRows={[
            {
              id: 'detail-total',
              cells: [
                { columnId: 'task', value: t('전체 합계') },
                { columnId: 'quantity', aggregate: 'sum' },
                { columnId: 'completed', aggregate: 'sum' },
              ],
            },
          ]}
          errorOverlay={
            error
              ? {
                  message: t('작업을 불러오지 못했습니다.'),
                  onRetry: retry,
                  retryLabel: t('다시 불러오기'),
                }
              : undefined
          }
          aria-label={t('상세 작업 목록')}
        />
      </div>
    </div>
  );
}

export const gridConfiguration: GridConfiguration = {
  rows: initialTasks
    .filter((_, index) => index % 4 === 0)
    .map((row, index) => ({ ...row, task: `주문 ORD-${String(index + 1).padStart(3, '0')}` })),
  columns: baseColumns,
  getRowId,
  rowSelectionMode: 'multiple',
  height: 420,
  detailPanel: {
    height: 280,
    loadRows: ({ row, signal }) =>
      loadRows(
        initialTasks.filter((task) => task.project === row.project),
        signal,
      ),
    renderDetail: (params) => <DetailGrid {...params} />,
  },
};

export function NestedDetailsGrid(props: GridViewProps = {}) {
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
