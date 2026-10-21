import { useDataGridApi } from '@owp/datagrid/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpDataGrid, OwpDataGridExportExcelButton } from '@owp/datagrid';
import type { OwpDataGridDetailRenderParams } from '@owp/datagrid/types';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import type { Task } from '../../types';
import { getRowId } from '../../model/data';
import { taskColumns } from '../configs/taskList';

export function DetailGrid({
  row,
  rows,
  loading,
  error,
  retry,
}: OwpDataGridDetailRenderParams<Task, Task>) {
  const gridApi = useDataGridApi<Task>();
  const { t } = useOwpTranslation();
  const columns = taskColumns.slice(1).map((column) => ({
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
          api={gridApi}
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
          api={gridApi}
          rows={rows}
          columns={columns}
          getRowId={getRowId}
          height="100%"
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
                  retryLabel: t('다시 시도'),
                }
              : undefined
          }
          aria-label={t('상세 작업 목록')}
        />
      </div>
    </div>
  );
}
