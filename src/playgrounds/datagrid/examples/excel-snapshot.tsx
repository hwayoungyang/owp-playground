import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useEffect, useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskExcelSnapshotConfiguration } from './configs/taskExcelSnapshot';

export { taskExcelSnapshotConfiguration as gridConfiguration } from './configs/taskExcelSnapshot';

export function ExcelSnapshotGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const publish = (api: string, value: unknown) => {
    onAction?.(api, value);
  };
  const request = useRef<AbortController | null>(null);
  const [reading, setReading] = useState(false);
  useEffect(() => () => request.current?.abort(), []);
  const handleReadBatches = async () => {
    const controller = new AbortController();
    request.current = controller;
    setReading(true);
    try {
      const session = await gridRef.current?.createExcelExportSession?.({
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
    const snapshot = gridRef.current?.getExcelSnapshot({ scope: 'visible' });
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
          <Button onClick={handlePreviewSnapshot}>{translate('데이터 미리보기')}</Button>
          <Button
            onClick={() =>
              publish('getExcelExportWarnings', gridRef.current?.getExcelExportWarnings?.())
            }
          >
            {translate('제외 항목 확인')}
          </Button>
          <Button disabled={reading} onClick={() => void handleReadBatches()}>
            {translate('1만 행 읽기')}
          </Button>
          {reading && <Button onClick={handleCancelExport}>{translate('취소')}</Button>}
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
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
