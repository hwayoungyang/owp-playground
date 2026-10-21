import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { projectDetailsConfiguration } from './configs/projectDetails';

export { projectDetailsConfiguration as gridConfiguration } from './configs/projectDetails';

export function ProjectDetailsGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
      rows={projectDetailsConfiguration.rows}
      columns={projectDetailsConfiguration.columns}
      getRowId={projectDetailsConfiguration.getRowId}
      rowSelectionMode={projectDetailsConfiguration.rowSelectionMode}
      height={projectDetailsConfiguration.height}
      detailPanel={projectDetailsConfiguration.detailPanel}
      {...gridProps}
    />
  );
}
