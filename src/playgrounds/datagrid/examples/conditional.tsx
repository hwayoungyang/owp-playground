import './styles.css';
import { conditionalStylesConfiguration } from './configs/conditionalStyles';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { useOwpTranslation } from '@owp/components/hooks';
import { FormControlLabel, MenuItem, Select, Switch } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridColumn } from '@owp/datagrid/types';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import type { Task } from '../types';
import type { TaskGridProps } from '../types';
import { editableTaskColumns } from './configs/taskList';

export { conditionalStylesConfiguration as gridConfiguration } from './configs/conditionalStyles';
const backgroundScopeSchema = z.enum(['cell', 'row']);

export function ConditionalStylesGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const { gridRef, callbacks, ...gridProps } = props;
  const [backgroundScope, setBackgroundScope] = useState<'cell' | 'row'>(() =>
    new URLSearchParams(window.location.search).get('sample') === 'row-background' ? 'row' : 'cell',
  );
  const [restrictCompleted, setRestrictCompleted] = useState(true);
  const columns = useMemo(
    () =>
      (gridProps.columns ?? editableTaskColumns).map<OwpDataGridColumn<Task>>((column) => ({
        ...column,
        cellStyle: ({ row }) => {
          if (backgroundScope === 'cell') {
            if (column.id !== 'completed') return {};
            return row.completed === row.quantity
              ? { backgroundColor: 'var(--pg-blue-wash)', color: 'var(--pg-blue)' }
              : { backgroundColor: 'var(--pg-purple-wash)', color: 'var(--pg-purple)' };
          }
          if (row.status === '완료') {
            return { backgroundColor: 'var(--pg-blue-wash)', color: 'var(--pg-blue)' };
          }
          return row.status === '검토 중'
            ? { backgroundColor: 'var(--pg-purple-wash)', color: 'var(--pg-purple)' }
            : {};
        },
        editable: (params) =>
          (!restrictCompleted || params.row.status !== '완료') &&
          (typeof column.editable === 'function'
            ? column.editable(params)
            : Boolean(column.editable)),
      })),
    [gridProps.columns, backgroundScope, restrictCompleted],
  );
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <span>{t('배경색 적용')}</span>
          <Select
            size="small"
            value={backgroundScope}
            inputProps={{ 'aria-label': t('배경색 적용') }}
            onChange={(event) =>
              setBackgroundScope(backgroundScopeSchema.parse(event.target.value))
            }
          >
            <MenuItem value="cell">{t('셀')}</MenuItem>
            <MenuItem value="row">{t('행')}</MenuItem>
          </Select>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={restrictCompleted}
                onChange={(_, checked) => setRestrictCompleted(checked)}
              />
            }
            label={t('완료 행 편집 제한')}
          />
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={conditionalStylesConfiguration.rows}
          getRowId={conditionalStylesConfiguration.getRowId}
          rowSelectionMode="multiple"
          height="100%"
          {...gridProps}
          columns={columns}
        />
      </div>
    </div>
  );
}
