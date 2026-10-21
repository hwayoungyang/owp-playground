import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import type { Task, TaskGridProps } from '../types';
import { mergedCellsExportConfiguration } from './configs/mergedCellsExport';

export { mergedCellsExportConfiguration as gridConfiguration } from './configs/mergedCellsExport';

export function MergedCellsExportGrid(props: TaskGridProps = {}) {
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  return (
    <OwpDataGrid
      api={gridApi}
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
