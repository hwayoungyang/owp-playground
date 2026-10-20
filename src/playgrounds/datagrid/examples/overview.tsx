import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { taskOverviewConfiguration } from './configs/taskOverview';

export { taskOverviewConfiguration as gridConfiguration } from './configs/taskOverview';

export function FixedRowsGrid({ gridRef, callbacks, ...gridProps }: TaskGridProps = {}) {
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={taskOverviewConfiguration.rows}
      columns={taskOverviewConfiguration.columns}
      getRowId={taskOverviewConfiguration.getRowId}
      rowSelectionMode="multiple"
      height={420}
      visibleRowCount={10}
      summaryRows={taskOverviewConfiguration.summaryRows}
      {...gridProps}
    />
  );
}
