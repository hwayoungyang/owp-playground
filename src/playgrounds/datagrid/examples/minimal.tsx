import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { taskMinimalConfiguration } from './configs/taskMinimal';

export { taskMinimalConfiguration as gridConfiguration } from './configs/taskMinimal';

export function MinimalGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={taskMinimalConfiguration.rows}
      columns={taskMinimalConfiguration.columns}
      getRowId={taskMinimalConfiguration.getRowId}
      rowSelectionMode={taskMinimalConfiguration.rowSelectionMode}
      height={taskMinimalConfiguration.height}
      canTotalCountRow={taskMinimalConfiguration.canTotalCountRow}
      {...gridProps}
    />
  );
}
