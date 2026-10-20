import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { virtualizedSpansConfiguration } from './configs/virtualizedSpans';

export { virtualizedSpansConfiguration as gridConfiguration } from './configs/virtualizedSpans';

export function VirtualizedSpansGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={virtualizedSpansConfiguration.rows}
      columns={virtualizedSpansConfiguration.columns}
      getRowId={virtualizedSpansConfiguration.getRowId}
      rowSelectionMode={virtualizedSpansConfiguration.rowSelectionMode}
      height={virtualizedSpansConfiguration.height}
      getCellRowSpanKey={virtualizedSpansConfiguration.getCellRowSpanKey}
      virtualization={virtualizedSpansConfiguration.virtualization}
      {...gridProps}
    />
  );
}
