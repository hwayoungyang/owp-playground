import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { automaticRowSpanConfiguration } from './configs/automaticRowSpan';

export { automaticRowSpanConfiguration as gridConfiguration } from './configs/automaticRowSpan';

export function AutomaticRowSpanGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={automaticRowSpanConfiguration.rows}
      columns={automaticRowSpanConfiguration.columns}
      getRowId={automaticRowSpanConfiguration.getRowId}
      rowSelectionMode={automaticRowSpanConfiguration.rowSelectionMode}
      height={automaticRowSpanConfiguration.height}
      getCellRowSpanKey={automaticRowSpanConfiguration.getCellRowSpanKey}
      layout={automaticRowSpanConfiguration.layout}
      {...gridProps}
    />
  );
}
