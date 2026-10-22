import './styles.css';
import { Button } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridRowId, OwpDataGridRowSelectionMode } from '@owp/datagrid/types';
import { useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskSelectionConfiguration } from './configs/taskSelection';

export { taskSelectionConfiguration as gridConfiguration } from './configs/taskSelection';

const selectionModes = [
  { value: 'single', label: '단일 선택 (라디오)' },
  { value: 'multiple', label: '다중 선택 (체크박스)' },
  { value: 'none', label: '선택 없음' },
] as const;

export type SelectionGridProps = TaskGridProps & {
  readonly onSelectionModeChange?: (mode: OwpDataGridRowSelectionMode) => void;
};

export function SelectionGrid({
  api: suppliedApi,
  callbacks,
  onSelectionModeChange,
  ...gridProps
}: SelectionGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const gridApi = suppliedApi ?? ownApi;
  const { t } = useOwpTranslation();
  const [selection, setSelection] = useState<readonly OwpDataGridRowId[]>([]);
  const [mode, setMode] = useState<OwpDataGridRowSelectionMode>('single');
  const selectionMode = gridProps.rowSelectionMode ?? mode;
  const selectedRowIds = gridProps.rowSelectionModel ?? selection;

  const handleSelectionChange: NonNullable<TaskGridProps['onRowSelectionModelChange']> = (
    rowIds,
  ) => {
    setSelection(rowIds);
    gridProps.onRowSelectionModelChange?.(rowIds);
  };

  const handleSelectionModeChange = (nextMode: OwpDataGridRowSelectionMode) => {
    if (nextMode === selectionMode) return;
    setMode(nextMode);
    (onSelectionModeChange ?? callbacks?.onSelectionModeChange)?.(nextMode);
    handleSelectionChange([]);
  };

  return (
    <div className="example-with-controls" style={{ height: gridProps.height ?? 420 }}>
      <PreviewActions>
        <div className="example-settings-toolbar example-settings-toolbar--general">
          <div
            className="example-settings-fields example-settings-fields--general"
            data-columns="1"
          >
            <fieldset className="example-setting-field" aria-label={t('행 선택 방식')}>
              <span className="example-setting-label">{t('행 선택 방식')}</span>
              <div className="example-setting-buttons example-setting-buttons--three">
                {selectionModes.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={selectionMode === value ? 'contained' : 'outlined'}
                    aria-pressed={selectionMode === value}
                    onClick={() => handleSelectionModeChange(value)}
                  >
                    {t(label)}
                  </Button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskSelectionConfiguration.rows}
          columns={taskSelectionConfiguration.columns}
          getRowId={taskSelectionConfiguration.getRowId}
          height="100%"
          {...gridProps}
          rowSelectionMode={selectionMode}
          rowSelectionModel={selectedRowIds}
          onRowSelectionModelChange={handleSelectionChange}
        />
      </div>
    </div>
  );
}
