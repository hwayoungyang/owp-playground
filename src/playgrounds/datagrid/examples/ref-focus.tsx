import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskFocusConfiguration } from './configs/taskFocus';

export { taskFocusConfiguration as gridConfiguration } from './configs/taskFocus';

export function CellFocusGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;

  const publish = (api: string, value: unknown) => {
    onAction?.(api, value);
  };

  const handleScrollToLastRow = () => {
    const grid = gridRef.current;
    const lastRow = grid?.getRows().at(-1);
    if (lastRow) publish('scrollToRow', grid?.scrollToRow(lastRow.id, 'end'));
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskFocusConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={() => publish('commitEditing', gridRef.current?.commitEditing())}>
            {translate('편집 확정')}
          </Button>
          <Button
            onClick={() =>
              publish(
                'setCellValue',
                gridRef.current?.setCellValue('task-1', 'task', translate('API로 바꾼 작업')),
              )
            }
          >
            {translate('첫 행의 작업명 변경')}
          </Button>
          <Button onClick={handleScrollToLastRow}>{translate('마지막 행 보기')}</Button>
          <Button
            onClick={() => publish('focusCell', gridRef.current?.focusCell('task-1', 'task'))}
          >
            {translate('첫 작업 셀로 이동')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={taskFocusConfiguration.rows}
          columns={taskFocusConfiguration.columns}
          getRowId={taskFocusConfiguration.getRowId}
          rowSelectionMode={taskFocusConfiguration.rowSelectionMode}
          height="100%"
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
