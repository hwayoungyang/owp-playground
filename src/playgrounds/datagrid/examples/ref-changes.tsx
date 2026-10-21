import './styles.css';
import { Button } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpDataGrid, OwpDataGridResetChangesButton } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { OwpDataGridChange } from '@owp/datagrid/types';
import { useLayoutEffect, useRef, useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskChangesConfiguration } from './configs/taskChanges';

export { taskChangesConfiguration as gridConfiguration } from './configs/taskChanges';

export function ChangeTrackingGrid({
  api: suppliedApi,
  callbacks,
  ...gridProps
}: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const gridApi = suppliedApi ?? ownApi;
  const { t } = useOwpTranslation();
  const mounted = useRef(false);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [changes, setChanges] = useState<readonly OwpDataGridChange<Task>[]>([]);
  const [inspection, setInspection] = useState<{
    readonly unsaved: boolean;
    readonly count: number;
  } | null>(null);
  const inspectChanges = () => {
    const unsaved = gridApi.hasUnsavedChanges();
    const currentChanges = gridApi.getChanges();
    setInspection({ unsaved, count: currentChanges.length });
    callbacks?.onAction?.('changes.inspect', { unsaved, changes: currentChanges });
  };

  const handleChangesChange: NonNullable<TaskGridProps['onChangesChange']> = (nextChanges) => {
    setChanges(nextChanges);
    gridProps.onChangesChange?.(nextChanges);
  };

  const handleAcceptChanges = () => {
    const grid = gridApi;
    if (!grid.commitEditing()) return;
    const validation = grid.validate();
    if (!validation.valid) {
      const firstError = validation.errors[0];
      if (firstError) grid.focusCell(firstError.rowId, firstError.columnId);
      return;
    }
    grid.acceptChanges();
    setChanges(grid.getChanges());
    inspectChanges();
  };

  return (
    <div className="example-with-controls" style={{ height: gridProps.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <Button onMouseDown={(event) => event.preventDefault()} onClick={inspectChanges}>
            {t('현재 변경 상태 조회')}
          </Button>
          <Button onClick={handleAcceptChanges}>{t('변경 확정')}</Button>
          <OwpDataGridResetChangesButton
            api={gridApi}
            onAfterReset={({ api }) => {
              // callback은 다음 tick에 실행되므로 예제 전환 뒤에는 연결된 API를 조회하지 않습니다.
              if (!mounted.current) return;
              const currentChanges = api.getChanges();
              setChanges(currentChanges);
              setInspection({ unsaved: api.hasUnsavedChanges(), count: currentChanges.length });
              callbacks?.onAction?.('resetChanges', currentChanges);
            }}
          >
            {t('변경 되돌리기')}
          </OwpDataGridResetChangesButton>
        </div>
      </PreviewActions>
      <div className="example-caption">
        <span>{t('Working-copy 변경 {{count}}건', { count: changes.length })}</span>
        <p>
          {t(
            'hasUnsavedChanges()로 미확정 입력까지 감지 가능. getChanges()는 working-copy 변경만 반환. 조회 버튼은 편집을 확정하지 않으며, 결과는 조회 시점 기준.',
          )}
        </p>
        {inspection && (
          <output aria-live="polite">
            {t('조회 결과: 미저장 {{unsaved}} · working-copy {{count}}건', {
              unsaved: String(inspection.unsaved),
              count: inspection.count,
            })}
          </output>
        )}
      </div>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskChangesConfiguration.rows}
          columns={taskChangesConfiguration.columns}
          getRowId={taskChangesConfiguration.getRowId}
          rowSelectionMode="multiple"
          height="100%"
          {...gridProps}
          onChangesChange={handleChangesChange}
        />
      </div>
    </div>
  );
}
