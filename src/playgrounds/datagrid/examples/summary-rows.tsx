import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { getRowId, initialTasks } from '../model/data';
import type { TaskGridProps } from '../types';
import { editableTaskColumns } from './configs/taskList';
import { summaryRowsConfiguration } from './configs/summaryRows';

export { summaryRowsConfiguration as gridConfiguration } from './configs/summaryRows';

export function SummaryRowsGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
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
