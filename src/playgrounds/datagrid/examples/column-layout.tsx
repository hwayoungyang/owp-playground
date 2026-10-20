import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { pinnedColumnsConfiguration } from './configs/pinnedColumns';

export { pinnedColumnsConfiguration as gridConfiguration } from './configs/pinnedColumns';

export function PinnedColumnsGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={pinnedColumnsConfiguration.rows}
      columns={pinnedColumnsConfiguration.columns}
      getRowId={pinnedColumnsConfiguration.getRowId}
      rowSelectionMode={pinnedColumnsConfiguration.rowSelectionMode}
      height={pinnedColumnsConfiguration.height}
      layout={pinnedColumnsConfiguration.layout}
      {...gridProps}
    />
  );
}
