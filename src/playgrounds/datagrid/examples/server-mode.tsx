import './styles.css';
import { OwpDataGrid } from '@owp/datagrid';
import type { OwpDataGridFilterItem, OwpDataGridSortItem } from '@owp/datagrid/types';
import { useEffect, useState } from 'react';
import { translate } from '../../../shared/i18n/translate';
import type { Task } from '../types';
import { initialTasks } from '../model/data';
import { queryTasks } from '../model/server';
import type { TaskGridProps } from '../types';
import { serverTaskQueryConfiguration } from './configs/serverTaskQuery';

export { serverTaskQueryConfiguration as gridConfiguration } from './configs/serverTaskQuery';

export function ServerQueryGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  const { onAction, onDataChange, onLoadingChange } = callbacks ?? {};
  const [rows, setRows] = useState<readonly Task[]>(initialTasks);
  const [sort, setSort] = useState<readonly OwpDataGridSortItem[]>([]);
  const [filters, setFilters] = useState<readonly OwpDataGridFilterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const sortModel = gridProps.sortModel ?? sort;
  const filterModel = gridProps.filterModel ?? filters;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    onLoadingChange?.(true);
    onAction?.('request', { sort: sortModel, filters: filterModel, retry: revision });
    void queryTasks(sortModel, filterModel, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        setRows(next);
        onDataChange?.(next);
        onAction?.('response', { count: next.length });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (reason instanceof Error) setError(reason.message);
        else throw reason;
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          onLoadingChange?.(false);
        }
      });
    return () => controller.abort();
  }, [sortModel, filterModel, onAction, onDataChange, onLoadingChange, revision]);
  const handleSortModelChange: NonNullable<TaskGridProps['onSortModelChange']> = (next) => {
    setSort(next);
    gridProps.onSortModelChange?.(next);
  };
  const handleFilterModelChange: NonNullable<TaskGridProps['onFilterModelChange']> = (next) => {
    setFilters(next);
    gridProps.onFilterModelChange?.(next);
  };
  return (
    <OwpDataGrid
      ref={gridRef}
      getRowId={serverTaskQueryConfiguration.getRowId}
      height={420}
      rowSelectionMode="multiple"
      columns={serverTaskQueryConfiguration.columns}
      sortingMode="manual"
      filteringMode="manual"
      layout={serverTaskQueryConfiguration.layout}
      {...gridProps}
      rows={rows}
      loading={loading}
      errorOverlay={
        error
          ? {
              message: error,
              onRetry: () => setRevision((value) => value + 1),
              retryLabel: translate('다시 시도'),
            }
          : undefined
      }
      sortModel={sortModel}
      onSortModelChange={handleSortModelChange}
      filterModel={filterModel}
      onFilterModelChange={handleFilterModelChange}
    />
  );
}
