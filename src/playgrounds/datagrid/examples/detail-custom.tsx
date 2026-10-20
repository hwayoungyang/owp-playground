import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { TaskGridProps } from '../types';
import { projectDetailsConfiguration } from './configs/projectDetails';

export { projectDetailsConfiguration as gridConfiguration } from './configs/projectDetails';

export function ProjectDetailsGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  return (
    <OwpDataGrid
      ref={gridRef}
      rows={projectDetailsConfiguration.rows}
      columns={projectDetailsConfiguration.columns}
      getRowId={projectDetailsConfiguration.getRowId}
      rowSelectionMode={projectDetailsConfiguration.rowSelectionMode}
      height={projectDetailsConfiguration.height}
      detailPanel={projectDetailsConfiguration.detailPanel}
      {...gridProps}
    />
  );
}
