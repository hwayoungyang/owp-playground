import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId } from '@owp/datagrid/types';
import { useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskFocusConfiguration } from './configs/taskFocus';

export { taskFocusConfiguration as gridConfiguration } from './configs/taskFocus';

export function CellFocusGrid(props: TaskGridProps = {}) {
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

  const handleScrollToLastRow = () => {
    const lastRow = gridApi.getRows().at(-1);
    if (lastRow) publish('scrollToRow', gridApi.scrollToRow(lastRow.id, 'end'));
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskFocusConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={() => publish('commitEditing', gridApi.commitEditing())}>
            {t('편집 확정')}
          </Button>
          <Button
            onClick={() =>
              publish('setCellValue', gridApi.setCellValue('task-1', 'task', t('API로 바꾼 작업')))
            }
          >
            {t('첫 행의 작업명 변경')}
          </Button>
          <Button onClick={handleScrollToLastRow}>{t('마지막 행 보기')}</Button>
          <Button onClick={() => publish('focusCell', gridApi.focusCell('task-1', 'task'))}>
            {t('첫 작업 셀로 이동')}
          </Button>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
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
