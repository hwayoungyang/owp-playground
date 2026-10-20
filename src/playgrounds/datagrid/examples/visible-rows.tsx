import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { taskVisibleRowsConfiguration } from './configs/taskVisibleRows';

export { taskVisibleRowsConfiguration as gridConfiguration } from './configs/taskVisibleRows';

export function VisibleRowsGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={taskVisibleRowsConfiguration.rows}
      columns={taskVisibleRowsConfiguration.columns}
      getRowId={taskVisibleRowsConfiguration.getRowId}
      rowSelectionMode={taskVisibleRowsConfiguration.rowSelectionMode}
      height={taskVisibleRowsConfiguration.height}
      visibleRowCount={taskVisibleRowsConfiguration.visibleRowCount}
      {...gridProps}
    />
  );
}
