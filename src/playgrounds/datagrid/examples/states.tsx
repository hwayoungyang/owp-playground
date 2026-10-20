import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { taskStatesConfiguration } from './configs/taskStates';

export { taskStatesConfiguration as gridConfiguration } from './configs/taskStates';

export function GridStates(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={taskStatesConfiguration.rows}
      columns={taskStatesConfiguration.columns}
      getRowId={taskStatesConfiguration.getRowId}
      rowSelectionMode={taskStatesConfiguration.rowSelectionMode}
      height={taskStatesConfiguration.height}
      noDataMessage={taskStatesConfiguration.noDataMessage}
      loading={false}
      {...gridProps}
    />
  );
}
