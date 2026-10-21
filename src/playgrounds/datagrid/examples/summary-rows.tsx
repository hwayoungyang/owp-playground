import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { getRowId, initialTasks } from '../model/data';
import type { Task, TaskGridProps } from '../types';
import { editableTaskColumns } from './configs/taskList';
import { summaryRowsConfiguration } from './configs/summaryRows';

export { summaryRowsConfiguration as gridConfiguration } from './configs/summaryRows';

export function SummaryRowsGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={initialTasks}
      columns={editableTaskColumns}
      getRowId={getRowId}
      height={420}
      rowSelectionMode="multiple"
      layout={{ filterRow: true }}
      summaryRows={summaryRowsConfiguration.summaryRows}
      pinnedBottomRows={summaryRowsConfiguration.pinnedBottomRows}
      pinnedBottomRowStyle={summaryRowsConfiguration.pinnedBottomRowStyle}
      {...gridProps}
    />
  );
}
