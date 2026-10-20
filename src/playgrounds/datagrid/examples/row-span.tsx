import './styles.css';
import type { SelectChangeEvent } from '@mui/material';
import { explicitRowSpanConfiguration } from './configs/explicitRowSpan';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { MenuItem, Select } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { TaskGridProps } from '../types';
import { taskColumns } from './configs/taskList';

export { explicitRowSpanConfiguration as gridConfiguration } from './configs/explicitRowSpan';

export function ExplicitRowSpanGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
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
        <div className="example-controls">
          <span>{translate('병합할 행 수')}</span>
          <Select
            value={size}
            inputProps={{ 'aria-label': translate('병합할 행 수') }}
            onChange={handleSpanSizeChange}
          >
            {[2, 3, 4].map((count) => (
              <MenuItem key={count} value={count}>
                {translate('{{count}}행씩', { count })}
              </MenuItem>
            ))}
          </Select>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
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
