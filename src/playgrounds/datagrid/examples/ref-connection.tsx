import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef } from '@owp/datagrid/types';
import { useRef } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { useExampleFeedback } from '../../../shared/ui/useExampleFeedback';
import type { Task, TaskGridProps } from '../types';
import { taskMinimalConfiguration } from './configs/taskMinimal';

export { taskMinimalConfiguration as gridConfiguration } from './configs/taskMinimal';

export function RefConnectionGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const gridRef = useRef<OwpDataGridRef<Task>>(null);
  const { api, callbacks, ...gridProps } = props;
  const { notify, feedback } = useExampleFeedback();

  const handleGetRows = () => {
    const rows = gridRef.current?.getRows();
    if (rows) {
      notify(t('조회 결과: {{count}}건', { count: rows.length }));
      callbacks?.onAction?.('getRows', { rowIds: rows.map((row) => row.id) });
    }
  };
  const handleFocusFirstTask = () => {
    const firstRow = gridRef.current?.getRows()[0];
    if (firstRow) {
      const result = gridRef.current?.focusCell(firstRow.id, 'task');
      callbacks?.onAction?.('focusCell', result);
    }
  };

  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskMinimalConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-settings-toolbar example-settings-toolbar--guidance">
          <div className="example-settings-fields example-guidance">
            <p>{t('ref.current로 연결된 Grid 제어 가능. 연결 전·해제 후 current는 null.')}</p>
            <p>{t('Hook과 Ref는 같은 Grid API를 제공하며 연결 방식만 다름.')}</p>
          </div>

          <div className="example-settings-actions">
            <Button onClick={handleGetRows}>{t('행 조회')}</Button>
            <Button onClick={handleFocusFirstTask}>{t('첫 작업 셀로 이동')}</Button>
          </div>
        </div>
      </PreviewActions>
      {feedback}
      <div className="example-grid">
        <OwpDataGrid
          {...taskMinimalConfiguration}
          height="100%"
          {...gridProps}
          api={api}
          ref={gridRef}
        />
      </div>
    </div>
  );
}
