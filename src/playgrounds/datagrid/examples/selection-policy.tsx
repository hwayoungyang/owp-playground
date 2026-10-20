import './styles.css';
import { Button, FormControlLabel, Switch } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { seedTask } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { taskSelectionPolicyConfiguration } from './configs/taskSelectionPolicy';

export { taskSelectionPolicyConfiguration as gridConfiguration } from './configs/taskSelectionPolicy';

export function NewRowSelectionGrid(props: TaskGridProps = {}) {
  const ownRef = useRef<OwpDataGridRef<Task>>(null);
  const { gridRef = ownRef, callbacks, ...gridProps } = props;
  const { onAction } = callbacks ?? {};
  const [allowAddedSelection, setAllowAddedSelection] = useState(true);
  const handleAddRow = () => {
    const row = { ...seedTask, id: crypto.randomUUID(), task: translate('새 작업') };
    const success = gridRef.current?.addRow(row, { position: 'root-first' });
    onAction?.('addRow', { success, rowId: row.id });
  };

  const handleAllowAddedSelectionChange = (checked: boolean) => {
    setAllowAddedSelection(checked);
    if (!checked) {
      const added = new Set(
        gridRef.current
          ?.getChanges()
          .filter((change) => change.type === 'added')
          .map((change) => change.rowId),
      );
      gridProps.onRowSelectionModelChange?.(
        (gridProps.rowSelectionModel ?? []).filter((id) => !added.has(id)),
      );
    }
    onAction?.('allowAddedRowSelection', checked);
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskSelectionPolicyConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-controls">
          <Button onClick={handleAddRow}>{translate('새 행 추가')}</Button>
          <FormControlLabel
            label={translate('새 행 선택 허용')}
            control={
              <Switch
                size="small"
                checked={allowAddedSelection}
                onChange={(_, checked) => handleAllowAddedSelectionChange(checked)}
              />
            }
          />
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={taskSelectionPolicyConfiguration.rows}
          columns={taskSelectionPolicyConfiguration.columns}
          getRowId={taskSelectionPolicyConfiguration.getRowId}
          height="100%"
          rowSelectionMode={taskSelectionPolicyConfiguration.rowSelectionMode}
          allowSelectAll={taskSelectionPolicyConfiguration.allowSelectAll}
          defaultRowSelectionModel={taskSelectionPolicyConfiguration.defaultRowSelectionModel}
          rowDeletion={taskSelectionPolicyConfiguration.rowDeletion}
          {...gridProps}
          layout={{
            ...gridProps.layout,
            rowPanel: {
              ...taskSelectionPolicyConfiguration.layout.rowPanel,
              allowAddedRowSelection: allowAddedSelection,
            },
          }}
        />
      </div>
    </div>
  );
}
