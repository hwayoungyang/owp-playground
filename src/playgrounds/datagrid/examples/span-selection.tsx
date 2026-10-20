import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { spanSelectionConfiguration } from './configs/spanSelection';

export { spanSelectionConfiguration as gridConfiguration } from './configs/spanSelection';

export function SpanSelectionGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={spanSelectionConfiguration.rows}
      columns={spanSelectionConfiguration.columns}
      getRowId={spanSelectionConfiguration.getRowId}
      rowSelectionMode={spanSelectionConfiguration.rowSelectionMode}
      height={spanSelectionConfiguration.height}
      getCellRowSpanKey={spanSelectionConfiguration.getCellRowSpanKey}
      rowSelectionScope={spanSelectionConfiguration.rowSelectionScope}
      rowDeletion={spanSelectionConfiguration.rowDeletion}
      {...gridProps}
    />
  );
}
