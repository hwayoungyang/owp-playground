import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { nestedDetailsConfiguration } from './configs/nestedDetails';

export { nestedDetailsConfiguration as gridConfiguration } from './configs/nestedDetails';

export function NestedDetailsGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={nestedDetailsConfiguration.rows}
      columns={nestedDetailsConfiguration.columns}
      getRowId={nestedDetailsConfiguration.getRowId}
      rowSelectionMode={nestedDetailsConfiguration.rowSelectionMode}
      height={nestedDetailsConfiguration.height}
      detailPanel={nestedDetailsConfiguration.detailPanel}
      {...gridProps}
    />
  );
}
