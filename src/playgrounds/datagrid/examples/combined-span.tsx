import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { combinedSpanConfiguration } from './configs/combinedSpan';

export { combinedSpanConfiguration as gridConfiguration } from './configs/combinedSpan';

export function CombinedSpanGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={combinedSpanConfiguration.rows}
      columns={combinedSpanConfiguration.columns}
      getRowId={combinedSpanConfiguration.getRowId}
      rowSelectionMode={combinedSpanConfiguration.rowSelectionMode}
      height={combinedSpanConfiguration.height}
      getCellRowSpanKey={combinedSpanConfiguration.getCellRowSpanKey}
      getCellSpan={combinedSpanConfiguration.getCellSpan}
      headerRows={combinedSpanConfiguration.headerRows}
      {...gridProps}
    />
  );
}
