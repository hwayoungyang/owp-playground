import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { getRowId } from '../model/data';
import type { TaskGridProps } from '../types';
import { cellBackgroundColumns, cellBackgroundConfiguration } from './configs/cellBackground';

export { cellBackgroundConfiguration as gridConfiguration } from './configs/cellBackground';

export function CellBackgroundGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={cellBackgroundConfiguration.rows}
      columns={cellBackgroundColumns}
      getRowId={getRowId}
      rowSelectionMode="multiple"
      height={420}
      {...gridProps}
    />
  );
}
