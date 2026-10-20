import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { seedTask } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { taskRowInsertionConfiguration } from './configs/taskRowInsertion';

import type {
  OwpDataGridRef,
  OwpDataGridRowId,
  OwpDataGridRowPlacement,
} from '@owp/datagrid/types';

export { taskRowInsertionConfiguration as gridConfiguration } from './configs/taskRowInsertion';

export function RowInsertionGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;

  const publish = (api: string, value: unknown) => {
    onAction?.(api, value);
  };
  const handleAddRow = (placement: OwpDataGridRowPlacement, label: string) => {
    const row = { ...seedTask, id: crypto.randomUUID(), task: translate(label) };
    publish('addRow', {
      success: gridRef.current?.addRow(row, placement),
      rowId: row.id,
      placement,
    });
  };
  const handleInsertAfterSelection = () => {
    const id = selected[0];
    if (id !== undefined)
      handleAddRow({ position: 'after', targetRowId: id }, '선택 행 다음에 추가');
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskRowInsertionConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={() => handleAddRow({ position: 'root-first' }, '상단에 추가')}>
            {translate('상단에 추가')}
          </Button>
          <Button disabled={selected.length !== 1} onClick={handleInsertAfterSelection}>
            {translate('선택 행 다음에 추가')}
          </Button>
          <Button onClick={() => handleAddRow({ position: 'root-last' }, '하단에 추가')}>
            {translate('하단에 추가')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={taskRowInsertionConfiguration.rows}
          columns={taskRowInsertionConfiguration.columns}
          getRowId={taskRowInsertionConfiguration.getRowId}
          rowSelectionMode={taskRowInsertionConfiguration.rowSelectionMode}
          height="100%"
          rowDeletion={taskRowInsertionConfiguration.rowDeletion}
          layout={taskRowInsertionConfiguration.layout}
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
