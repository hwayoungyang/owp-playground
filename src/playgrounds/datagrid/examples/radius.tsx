import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import type { SelectChangeEvent } from '@mui/material';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { MenuItem, Select } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { useEffect, useState } from 'react';
import { getRowId } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { taskColumns } from './configs/taskList';
import { gridRadiusConfiguration } from './configs/gridRadius';

export { gridRadiusConfiguration as gridConfiguration } from './configs/gridRadius';

export function RadiusGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const { onAction, onRadiusChange } = callbacks ?? {};
  const [radius, setRadius] = useState(0.25);
  useEffect(() => {
    if (typeof gridProps.radius === 'number') setRadius(gridProps.radius);
  }, [gridProps.radius]);
  function handleRadiusChange(event: SelectChangeEvent<number>) {
    const next = Number(event.target.value);
    if ([0, 0.25, 0.5, 0.75].includes(next)) {
      setRadius(next);
      onRadiusChange?.(next);
      onAction?.('radius', next);
    }
  }

  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <span>{t('모서리 둥글기')}</span>
          <Select
            value={radius}
            inputProps={{ 'aria-label': t('모서리 둥글기') }}
            onChange={handleRadiusChange}
          >
            <MenuItem value={0}>{t('기본 (각진)')}</MenuItem>
            <MenuItem value={0.25}>{t('작게')}</MenuItem>
            <MenuItem value={0.5}>{t('중간')}</MenuItem>
            <MenuItem value={0.75}>{t('크게')}</MenuItem>
          </Select>
        </div>
      </PreviewActions>
      <div className="example-grid" style={{ padding: 12 }}>
        <OwpDataGrid
          api={gridApi}
          rows={gridRadiusConfiguration.rows}
          columns={taskColumns}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          height="100%"
          {...gridProps}
          radius={radius}
        />
      </div>
    </div>
  );
}
