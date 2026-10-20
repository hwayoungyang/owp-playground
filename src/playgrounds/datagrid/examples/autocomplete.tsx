import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { autocompleteEditorsConfiguration } from './configs/autocompleteEditors';

export { autocompleteEditorsConfiguration as gridConfiguration } from './configs/autocompleteEditors';

export function AutocompleteGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={autocompleteEditorsConfiguration.rows}
      columns={autocompleteEditorsConfiguration.columns}
      getRowId={autocompleteEditorsConfiguration.getRowId}
      rowSelectionMode={autocompleteEditorsConfiguration.rowSelectionMode}
      height={autocompleteEditorsConfiguration.height}
      {...gridProps}
    />
  );
}
