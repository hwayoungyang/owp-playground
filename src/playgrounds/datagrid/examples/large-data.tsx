import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { taskLargeDataConfiguration } from './configs/taskLargeData';

export { taskLargeDataConfiguration as gridConfiguration } from './configs/taskLargeData';

export function LargeDatasetGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={taskLargeDataConfiguration.rows}
      columns={taskLargeDataConfiguration.columns}
      getRowId={taskLargeDataConfiguration.getRowId}
      rowSelectionMode={taskLargeDataConfiguration.rowSelectionMode}
      height={taskLargeDataConfiguration.height}
      virtualization={taskLargeDataConfiguration.virtualization}
      {...gridProps}
    />
  );
}
