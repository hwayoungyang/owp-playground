import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId } from '@owp/datagrid/types';
import { useLayoutEffect, useRef, useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskExcelSnapshotConfiguration } from './configs/taskExcelSnapshot';

export { taskExcelSnapshotConfiguration as gridConfiguration } from './configs/taskExcelSnapshot';

export function ExcelSnapshotGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const publish = (api: string, value: unknown) => {
    onAction?.(api, value);
  };
  const request = useRef<AbortController | null>(null);
  const [reading, setReading] = useState(false);
  useLayoutEffect(() => () => request.current?.abort(), []);
  const handleReadBatches = async () => {
    const controller = new AbortController();
    request.current = controller;
    setReading(true);
    try {
      const session = await gridApi.createExcelExportSession?.({
        scope: 'all',
        signal: controller.signal,
      });
      if (!session) return;
      let count = 0;
      let batches = 0;
      while (!controller.signal.aborted) {
        const rows = await session.readRows();
        if (rows.length === 0) break;
        count += rows.length;
        batches += 1;
      }
      if (!controller.signal.aborted)
        publish('createExcelExportSession', {
          count,
          batches,
          summaryRows: await session.getSummaryRows(),
        });
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (error instanceof Error) publish('excel.error', { message: error.message });
      else throw error;
    } finally {
      if (!controller.signal.aborted) setReading(false);
    }
  };
  const handlePreviewSnapshot = () => {
    const snapshot = gridApi.getExcelSnapshot({ scope: 'visible' });
    publish('getExcelSnapshot', {
      scope: snapshot?.scope,
      columns: snapshot?.columns,
      count: snapshot?.rows.length,
      firstRow: snapshot?.rows[0],
    });
  };
  const handleCancelExport = () => {
    request.current?.abort();
    setReading(false);
    publish('excel.cancel', { cancelled: true });
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskExcelSnapshotConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={handlePreviewSnapshot}>{t('데이터 미리보기')}</Button>
          <Button
            onClick={() => publish('getExcelExportWarnings', gridApi.getExcelExportWarnings?.())}
          >
            {t('제외 항목 확인')}
          </Button>
          <Button disabled={reading} onClick={() => void handleReadBatches()}>
            {t('1만 행 읽기')}
          </Button>
          {reading && <Button onClick={handleCancelExport}>{t('취소')}</Button>}
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskExcelSnapshotConfiguration.rows}
          columns={taskExcelSnapshotConfiguration.columns}
          getRowId={taskExcelSnapshotConfiguration.getRowId}
          height="100%"
          rowSelectionMode={taskExcelSnapshotConfiguration.rowSelectionMode}
          virtualization={taskExcelSnapshotConfiguration.virtualization}
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
