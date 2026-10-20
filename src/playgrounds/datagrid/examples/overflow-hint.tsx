import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import { getRowId } from '../model/data';
import type { TaskGridProps } from '../types';
import { overflowHintsColumns, overflowHintsConfiguration } from './configs/overflowHints';

export { overflowHintsConfiguration as gridConfiguration } from './configs/overflowHints';

export function OverflowHintsGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={overflowHintsConfiguration.rows}
      columns={overflowHintsColumns}
      getRowId={getRowId}
      height={420}
      rowSelectionMode="none"
      overflowHint={{ header: true, cell: true }}
      {...gridProps}
    />
  );
}
