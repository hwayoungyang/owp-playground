import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { headerSortConfiguration } from './configs/headerSort';

export { headerSortConfiguration as gridConfiguration } from './configs/headerSort';

export function HeaderSortGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={headerSortConfiguration.rows}
      columns={headerSortConfiguration.columns}
      getRowId={headerSortConfiguration.getRowId}
      rowSelectionMode={headerSortConfiguration.rowSelectionMode}
      height={headerSortConfiguration.height}
      headerRows={headerSortConfiguration.headerRows}
      hideChildHeaderSortButtons={false}
      {...gridProps}
    />
  );
}
