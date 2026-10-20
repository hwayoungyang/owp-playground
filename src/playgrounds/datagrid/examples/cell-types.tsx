import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { cellTypesConfiguration } from './configs/cellTypes';

export { cellTypesConfiguration as gridConfiguration } from './configs/cellTypes';

export function CellTypesGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={cellTypesConfiguration.rows}
      columns={cellTypesConfiguration.columns}
      getRowId={cellTypesConfiguration.getRowId}
      rowSelectionMode={cellTypesConfiguration.rowSelectionMode}
      height={cellTypesConfiguration.height}
      {...gridProps}
    />
  );
}
