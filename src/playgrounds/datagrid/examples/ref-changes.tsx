import './styles.css';
import { Button } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridChange, OwpDataGridRef } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskChangesConfiguration } from './configs/taskChanges';

export { taskChangesConfiguration as gridConfiguration } from './configs/taskChanges';

export function ChangeTrackingGrid({
  gridRef: externalRef,
  callbacks,
  ...gridProps
}: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const gridRef = externalRef ?? ownRef;
  const [changes, setChanges] = useState<readonly OwpDataGridChange<Task>[]>([]);

  const handleChangesChange: NonNullable<TaskGridProps['onChangesChange']> = (nextChanges) => {
    setChanges(nextChanges);
    gridProps.onChangesChange?.(nextChanges);
  };

  const handleAcceptChanges = () => {
    const grid = gridRef.current;
    if (!grid || !grid.commitEditing()) return;
    const validation = grid.validate();
    if (!validation.valid) {
      const firstError = validation.errors[0];
      if (firstError) grid.focusCell(firstError.rowId, firstError.columnId);
      return;
    }
    grid.acceptChanges();
    setChanges(grid.getChanges());
  };

  const handleResetChanges = () => {
    const grid = gridRef.current;
    if (!grid) return;
    grid.resetChanges();
    setChanges(grid.getChanges());
  };

  return (
    <div className="example-with-controls" style={{ height: gridProps.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <Button disabled={changes.length === 0} onClick={handleAcceptChanges}>
            {t('변경 확정')}
          </Button>
          <Button disabled={changes.length === 0} onClick={handleResetChanges}>
            {t('변경 되돌리기')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={taskChangesConfiguration.rows}
          columns={taskChangesConfiguration.columns}
          getRowId={taskChangesConfiguration.getRowId}
          rowSelectionMode="multiple"
          height="100%"
          {...gridProps}
          onChangesChange={handleChangesChange}
        />
      </div>
    </div>
  );
}
