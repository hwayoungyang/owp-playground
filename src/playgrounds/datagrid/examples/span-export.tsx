import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { mergedCellsExportConfiguration } from './configs/mergedCellsExport';

export { mergedCellsExportConfiguration as gridConfiguration } from './configs/mergedCellsExport';

export function MergedCellsExportGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={mergedCellsExportConfiguration.rows}
      columns={mergedCellsExportConfiguration.columns}
      getRowId={mergedCellsExportConfiguration.getRowId}
      rowSelectionMode={mergedCellsExportConfiguration.rowSelectionMode}
      height={mergedCellsExportConfiguration.height}
      headerRows={mergedCellsExportConfiguration.headerRows}
      getCellRowSpanKey={mergedCellsExportConfiguration.getCellRowSpanKey}
      pinnedBottomRows={mergedCellsExportConfiguration.pinnedBottomRows}
      {...gridProps}
    />
  );
}
