import './styles.css';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { useOwpTranslation } from '@owp/components/hooks';
import { FormControlLabel, Switch } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { useState } from 'react';
import { getRowId, initialTasks } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { taskColumns } from './configs/taskList';
import { groupedHeadersGroupedHeaders } from './configs/groupedHeaders';

export { groupedHeadersConfiguration as gridConfiguration } from './configs/groupedHeaders';

export function GroupedHeadersGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { t } = useOwpTranslation();
  const [showChildSorting, setShowChildSorting] = useState(true);
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showChildSorting}
                onChange={(_, checked) => setShowChildSorting(checked)}
              />
            }
            label={t('하위 컬럼 정렬 버튼 표시')}
          />
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={initialTasks}
          columns={taskColumns}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          height="100%"
          headerRows={groupedHeadersGroupedHeaders}
          {...gridProps}
          hideChildHeaderSortButtons={!showChildSorting}
        />
      </div>
    </div>
  );
}
