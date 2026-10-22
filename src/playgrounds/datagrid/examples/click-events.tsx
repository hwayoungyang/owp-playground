import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId } from '@owp/datagrid/types';
import { useState } from 'react';
import type { Task, TaskGridProps } from '../types';
import { taskClickEventsConfiguration } from './configs/taskClickEvents';

export { taskClickEventsConfiguration as gridConfiguration } from './configs/taskClickEvents';

export function ClickEventsGrid(props: TaskGridProps = {}) {
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

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskClickEventsConfiguration.height }}
    >
      <div className="example-guidance">
        <p>{t('셀·행 클릭 결과는 이벤트 탭에서 확인할 수 있습니다.')}</p>
      </div>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
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
