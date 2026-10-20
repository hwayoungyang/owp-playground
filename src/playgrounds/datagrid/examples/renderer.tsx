import './styles.css';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef } from '@owp/datagrid/types';
import { useMemo, useRef, useState } from 'react';
import type { Task, TaskGridProps } from '../types';
import { taskRendererConfiguration, createTaskRendererColumns } from './configs/taskRenderer';

export { taskRendererConfiguration as gridConfiguration } from './configs/taskRenderer';

export function CellRendererGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const { t } = useOwpTranslation();
  const [error, setError] = useState('');
  const columns = useMemo(
    () =>
      createTaskRendererColumns({
        complete: (row) => {
          const grid = gridRef.current;
          if (!grid?.commitEditing()) {
            setError('편집 중인 셀에 오류가 있습니다.');
            return;
          }
          const result = grid.applyTransaction([
            { type: 'setCellValue', rowId: row.id, columnId: 'status', value: '완료' },
            { type: 'setCellValue', rowId: row.id, columnId: 'progress', value: 100 },
          ]);
          setError(result.success ? '' : '변경을 적용하지 못했습니다.');
          onAction?.('cell.complete', { rowId: row.id, result });
        },
        toggle: (row, checked) => {
          const grid = gridRef.current;
          const success = Boolean(
            grid?.commitEditing() && grid.setCellValue(row.id, 'active', checked),
          );
          setError(success ? '' : '변경을 적용하지 못했습니다.');
          onAction?.('cell.notifications', { rowId: row.id, checked, success });
        },
      }).map((column) => ({ ...column, header: t(String(column.header)) })),
    [gridRef, onAction, t],
  );

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskRendererConfiguration.height }}
    >
      {error && (
        <output className="example-caption" role="alert">
          {t(error)}
        </output>
      )}
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
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
