import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef, OwpDataGridRowId } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task, TaskGridProps } from '../types';
import { taskClickEventsConfiguration } from './configs/taskClickEvents';

export { taskClickEventsConfiguration as gridConfiguration } from './configs/taskClickEvents';

export function ClickEventsGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const selected = gridProps.rowSelectionModel ?? selection;
  const [result, setResult] = useState<unknown>(null);

  const publish = (api: string, value: unknown) => {
    setResult({ api, value });
    onAction?.(api, value);
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskClickEventsConfiguration.height }}
    >
      {result !== null && (
        <output className="example-result" aria-label={translate('실행 결과')}>
          {JSON.stringify(result, null, 2)}
        </output>
      )}
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={taskClickEventsConfiguration.rows}
          columns={taskClickEventsConfiguration.columns}
          getRowId={taskClickEventsConfiguration.getRowId}
          rowSelectionMode={taskClickEventsConfiguration.rowSelectionMode}
          height="100%"
          {...gridProps}
          rowSelectionModel={selected}
          onRowSelectionModelChange={(next) => {
            setSelection(next);
            gridProps.onRowSelectionModelChange?.(next);
          }}
          onCellClick={(params) => {
            publish('onCellClick', {
              rowId: params.rowId,
              columnId: params.column.id,
              value: params.value,
            });
            gridProps.onCellClick?.(params);
          }}
          onRowClick={(params) => {
            publish('onRowClick', {
              rowId: params.rowId,
              dataIndex: params.dataIndex,
              displayIndex: params.displayIndex,
            });
            gridProps.onRowClick?.(params);
          }}
        />
      </div>
    </div>
  );
}
