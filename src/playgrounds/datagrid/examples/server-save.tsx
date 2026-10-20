import './styles.css';
import { Button } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useEffect, useRef, useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { seedTask } from '../model/data';
import { saveTasks } from '../model/server';
import type { Task, TaskGridProps } from '../types';
import { taskSaveConfiguration } from './configs/taskSave';

export { taskSaveConfiguration as gridConfiguration } from './configs/taskSave';

export function ServerSaveGrid({
  gridRef: externalRef,
  callbacks,
  ...gridProps
}: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const gridRef = externalRef ?? ownRef;
  const request = useRef<AbortController | null>(null);
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const selectedRowIds = gridProps.rowSelectionModel ?? selection;

  useEffect(() => () => request.current?.abort(), []);

  const handleSelectionChange: NonNullable<TaskGridProps['onRowSelectionModelChange']> = (
    rowIds,
  ) => {
    setSelection(rowIds);
    gridProps.onRowSelectionModelChange?.(rowIds);
  };

  const handleAdd = () => {
    const grid = gridRef.current;
    if (!grid || !grid.commitEditing()) return;
    grid.addRow({ ...seedTask, id: crypto.randomUUID(), task: t('새 작업') });
  };

  const handleDelete = () => {
    const grid = gridRef.current;
    if (!grid || !grid.commitEditing()) return;
    grid.deleteRows(selectedRowIds);
  };

  const handleSave = async () => {
    const grid = gridRef.current;
    if (request.current || !grid || !grid.commitEditing()) return;
    const validation = grid.validate();
    if (!validation.valid) {
      const firstError = validation.errors[0];
      if (firstError) grid.focusCell(firstError.rowId, firstError.columnId);
      return;
    }

    const submittedRows = grid.getRows();
    const submittedById = new Map(submittedRows.map((row) => [row.id, row]));
    const deletedRowIds = grid
      .getChanges()
      .filter((change) => change.type === 'deleted')
      .map((change) => change.rowId);
    const controller = new AbortController();
    request.current = controller;
    setSaving(true);
    setSaveError('');
    try {
      const savedRows = await saveTasks(submittedRows, controller.signal);
      if (controller.signal.aborted) return;
      // 요청 당시 행을 함께 전달해 저장 대기 중에 다시 편집한 값을 보존합니다.
      grid.applyServerRows({
        rows: savedRows.map((row) => ({
          rowId: row.id,
          row,
          submittedRow: submittedById.get(row.id),
        })),
        deletedRowIds,
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      if (!controller.signal.aborted) setSaveError(t('저장하지 못했습니다. 다시 시도해 주세요.'));
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (!controller.signal.aborted) setSaving(false);
      }
    }
  };

  const handleCancelSave = () => {
    request.current?.abort();
    request.current = null;
    setSaving(false);
  };

  return (
    <div className="example-with-controls" style={{ height: gridProps.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <Button disabled={saving} onClick={handleSave}>
            {t('모의 저장')}
          </Button>
          <Button onClick={handleAdd}>{t('새 행 추가')}</Button>
          <Button disabled={selectedRowIds.length === 0} onClick={handleDelete}>
            {t('선택 행 삭제')}
          </Button>
          {saving && (
            <>
              <span>{t('저장 중에도 셀을 편집할 수 있습니다.')}</span>
              <Button onClick={handleCancelSave}>{t('취소')}</Button>
            </>
          )}
          {saveError && <span role="alert">{saveError}</span>}
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={taskSaveConfiguration.rows}
          columns={taskSaveConfiguration.columns}
          getRowId={taskSaveConfiguration.getRowId}
          height="100%"
          rowSelectionMode="multiple"
          rowDeletion
          layout={taskSaveConfiguration.layout}
          {...gridProps}
          rowSelectionModel={selectedRowIds}
          onRowSelectionModelChange={handleSelectionChange}
        />
      </div>
    </div>
  );
}
