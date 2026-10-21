import { useOwpTranslation } from '@owp/components/hooks';
import './styles.css';
import { Button } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridRef } from '@owp/datagrid/types';
import { useRef, useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import type { Task, TaskGridProps } from '../types';
import { taskMinimalConfiguration } from './configs/taskMinimal';

export { taskMinimalConfiguration as gridConfiguration } from './configs/taskMinimal';

export function RefConnectionGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const gridRef = useRef<OwpDataGridRef<Task>>(null);
  const { api, callbacks, ...gridProps } = props;
  const [count, setCount] = useState<number | null>(null);

  const handleGetRows = () => {
    const rows = gridRef.current?.getRows();
    if (rows) {
      setCount(rows.length);
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
        <div className="example-controls">
          <Button onClick={handleGetRows}>{t('행 조회')}</Button>
          <Button onClick={handleFocusFirstTask}>{t('첫 작업 셀로 이동')}</Button>
          {count !== null && <span role="status">{t('조회 결과: {{count}}행', { count })}</span>}
        </div>
      </PreviewActions>
      <p className="example-caption">
        {t('ref.current로 연결된 Grid 제어 가능. 연결 전·해제 후 current는 null.')}
      </p>
      <p className="example-caption">
        {t('Hook과 Ref는 같은 Grid API를 제공하며 연결 방식만 다름.')}
      </p>
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
