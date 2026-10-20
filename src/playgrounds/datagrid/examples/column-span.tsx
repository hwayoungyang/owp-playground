import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { columnSpanConfiguration } from './configs/columnSpan';

export { columnSpanConfiguration as gridConfiguration } from './configs/columnSpan';

export function ColumnSpanGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={columnSpanConfiguration.rows}
      columns={columnSpanConfiguration.columns}
      getRowId={columnSpanConfiguration.getRowId}
      rowSelectionMode={columnSpanConfiguration.rowSelectionMode}
      height={columnSpanConfiguration.height}
      getCellSpan={columnSpanConfiguration.getCellSpan}
      {...gridProps}
    />
  );
}
