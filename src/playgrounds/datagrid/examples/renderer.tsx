import './styles.css';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { useMemo } from 'react';
import { useExampleFeedback } from '../../../shared/ui/useExampleFeedback';
import type { Task, TaskGridProps } from '../types';
import { taskRendererConfiguration, createTaskRendererColumns } from './configs/taskRenderer';

export { taskRendererConfiguration as gridConfiguration } from './configs/taskRenderer';

export function CellRendererGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const { t } = useOwpTranslation();
  const { notify, dismiss, feedback } = useExampleFeedback();
  const columns = useMemo(
    () =>
      createTaskRendererColumns(t, {
        complete: (row) => {
          const grid = gridApi;
          if (!grid.commitEditing()) {
            notify(t('편집 중인 셀에 오류가 있습니다.'), 'error');
            return;
          }
          const result = grid.applyTransaction([
            { type: 'setCellValue', rowId: row.id, columnId: 'status', value: '완료' },
            { type: 'setCellValue', rowId: row.id, columnId: 'progress', value: 100 },
          ]);
          if (result.success) dismiss();
          else notify(t('변경을 적용하지 못했습니다.'), 'error');
          onAction?.('cell.complete', { rowId: row.id, result });
        },
        toggle: (row, checked) => {
          const grid = gridApi;
          const success = Boolean(
            grid.commitEditing() && grid.setCellValue(row.id, 'active', checked),
          );
          if (success) dismiss();
          else notify(t('변경을 적용하지 못했습니다.'), 'error');
          onAction?.('cell.notifications', { rowId: row.id, checked, success });
        },
      }).map((column) => ({ ...column, header: t(String(column.header)) })),
    [gridApi, onAction, t, notify, dismiss],
  );

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskRendererConfiguration.height }}
    >
      {feedback}
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskRendererConfiguration.rows}
          getRowId={taskRendererConfiguration.getRowId}
          rowSelectionMode={taskRendererConfiguration.rowSelectionMode}
          height="100%"
          {...gridProps}
          columns={columns}
        />
      </div>
    </div>
  );
}
