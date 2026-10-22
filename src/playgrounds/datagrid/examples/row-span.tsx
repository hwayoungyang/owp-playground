import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import type { SelectChangeEvent } from '@mui/material';
import { explicitRowSpanConfiguration } from './configs/explicitRowSpan';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { MenuItem, Select } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { useState } from 'react';
import type { Task, TaskGridProps } from '../types';
import { taskColumns } from './configs/taskList';

export { explicitRowSpanConfiguration as gridConfiguration } from './configs/explicitRowSpan';

export function ExplicitRowSpanGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction } = callbacks ?? {};
  const [size, setSize] = useState(4);
  function handleSpanSizeChange(event: SelectChangeEvent<number>) {
    const next = Number(event.target.value);
    if ([2, 3, 4].includes(next)) {
      setSize(next);
      onAction?.('rowSpan', next);
    }
  }

  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-settings-toolbar example-settings-toolbar--general">
          <div
            className="example-settings-fields example-settings-fields--general"
            data-columns="1"
          >
            <div className="example-setting-field">
              <span className="example-setting-label">{t('병합할 행 수')}</span>
              <Select
                value={size}
                inputProps={{ 'aria-label': t('병합할 행 수') }}
                onChange={handleSpanSizeChange}
              >
                {[2, 3, 4].map((count) => (
                  <MenuItem key={count} value={count}>
                    {t('{{count}}행씩', { count })}
                  </MenuItem>
                ))}
              </Select>
              <p className="example-setting-help">
                {t(
                  '행 수를 4로 지정하면 1~4행, 5~8행처럼 묶어 병합합니다. 자동 행 병합은 같은 값이 연속된 셀을 묶습니다.',
                )}
              </p>
            </div>
          </div>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={explicitRowSpanConfiguration.rows}
          columns={taskColumns}
          getRowId={explicitRowSpanConfiguration.getRowId}
          rowSelectionMode="multiple"
          height="100%"
          {...gridProps}
          getCellSpan={({ column, displayIndex }) =>
            column.id === 'project' && displayIndex !== undefined && displayIndex % size === 0
              ? { rowSpan: size }
              : undefined
          }
        />
      </div>
    </div>
  );
}
