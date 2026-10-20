import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { getRowId } from '../model/data';
import type { TaskGridProps } from '../types';
import { rowBackgroundColumns, rowBackgroundConfiguration } from './configs/rowBackground';

export { rowBackgroundConfiguration as gridConfiguration } from './configs/rowBackground';

export function RowBackgroundGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={rowBackgroundConfiguration.rows}
      columns={rowBackgroundColumns}
      getRowId={getRowId}
      rowSelectionMode="multiple"
      height={420}
      {...gridProps}
    />
  );
}
