import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { rowCellTypesConfiguration } from './configs/rowCellTypes';

export { rowCellTypesConfiguration as gridConfiguration } from './configs/rowCellTypes';

export function RowCellTypesGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={rowCellTypesConfiguration.rows}
      columns={rowCellTypesConfiguration.columns}
      getRowId={rowCellTypesConfiguration.getRowId}
      rowSelectionMode={rowCellTypesConfiguration.rowSelectionMode}
      height={rowCellTypesConfiguration.height}
      {...gridProps}
    />
  );
}
