import { useDataGridApi } from '@owp/datagrid/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import type {
  OwpDataGridChange,
  OwpDataGridFilterItem,
  OwpDataGridRowId,
  OwpDataGridSortItem,
} from '@owp/datagrid/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EventLogEntry } from '../../../shared/types/events';
import type { GridExample } from '../catalog';
import { generateTasks, initialTasks, type Task } from '../model/data';
import { getGridConfiguration } from '../model/gridConfiguration';
import { type GridState, gridStates } from '../model/gridStates';

type PendingBinding = {
  readonly controller: AbortController;
  readonly count: number;
  readonly startedAt: number;
};

export function useGridController(example: GridExample) {
  const { i18n } = useOwpTranslation();
  const language = i18n.language;
  const configuration = useMemo(
    () => getGridConfiguration(example.id, language),
    [example.id, language],
  );
  const gridApi = useDataGridApi<Task>();
  const [pendingBinding, setPendingBinding] = useState<PendingBinding | null>(() =>
    example.id === 'large-data'
      ? {
          controller: new AbortController(),
          count: configuration.rows.length,
          startedAt: performance.now(),
        }
      : null,
  );
  const request = useRef<AbortController | null>(pendingBinding?.controller ?? null);
  const sequence = useRef(0);
  const [rows, setRows] = useState(configuration.rows);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(configuration.loading));
  const [error, setError] = useState(false);
  const [events, setEvents] = useState<readonly EventLogEntry[]>([]);
  const [selected, setSelected] = useState<readonly OwpDataGridRowId[]>(
    configuration.defaultRowSelectionModel ?? [],
  );
  const [sort, setSort] = useState<readonly OwpDataGridSortItem[]>(
    configuration.defaultSortModel ?? [],
  );
  const [filters, setFilters] = useState<readonly OwpDataGridFilterItem[]>(
    configuration.defaultFilterModel ?? [],
  );
  const [changeCount, setChangeCount] = useState(0);
  const [rowCount, setRowCount] = useState(rows.length);
  const [gridVersion, setGridVersion] = useState(0);
  const [bindingTime, setBindingTime] = useState<{
    readonly count: number;
    readonly milliseconds: number;
  } | null>(null);

  const record = useCallback((name: string, value: unknown) => {
    sequence.current += 1;
    const entry = {
      id: sequence.current,
      time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
      name,
      value: JSON.stringify(value, null, 2) ?? '',
    };
    setEvents((previous) => [entry, ...previous].slice(0, 40));
  }, []);
  useEffect(() => () => request.current?.abort(), []);

  const finishBinding = useCallback(
    (pending: PendingBinding) => {
      if (request.current !== pending.controller || pending.controller.signal.aborted) return;
      const milliseconds = Math.round((performance.now() - pending.startedAt) * 10) / 10;
      request.current = null;
      setPendingBinding(null);
      setBindingTime({ count: pending.count, milliseconds });
      record('dataset', { count: pending.count, bindingMs: milliseconds });
    },
    [record],
  );

  const onChanges = useCallback(
    (next: readonly OwpDataGridChange<Task>[]) => {
      setChangeCount(next.length);
      setRowCount(gridApi.getRows().length);
      record('changes', {
        count: next.length,
        rows: next.slice(0, 10).map((change) => ({ rowId: change.rowId, type: change.type })),
      });
    },
    [gridApi, record],
  );

  const reset = () => {
    request.current?.abort();
    const controller = example.id === 'large-data' ? new AbortController() : null;
    request.current = controller;
    setPendingBinding(
      controller
        ? { controller, count: configuration.rows.length, startedAt: performance.now() }
        : null,
    );
    setBindingTime(null);
    setBusy(false);
    setRows(configuration.rows);
    setGridVersion((version) => version + 1);
    setRowCount(configuration.rows.length);
    setSelected(configuration.defaultRowSelectionModel ?? []);
    setSort(configuration.defaultSortModel ?? []);
    setFilters(configuration.defaultFilterModel ?? []);
    setLoading(Boolean(configuration.loading));
    setError(false);
    setChangeCount(0);
    setEvents([]);
  };

  const generate = async (count: number) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setPendingBinding(null);
    setBindingTime(null);
    setBusy(true);
    setRows([]);
    setRowCount(0);
    setGridVersion((version) => version + 1);
    setSelected([]);
    setSort([]);
    setFilters([]);
    setChangeCount(0);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    let bindingStarted = false;
    try {
      const next = await generateTasks(count, controller.signal);
      if (controller.signal.aborted) return;
      if (next) {
        bindingStarted = true;
        setPendingBinding({ controller, count, startedAt: performance.now() });
        setRows(next);
        setRowCount(next.length);
        setSort([]);
        setFilters([]);
        setChangeCount(0);
      }
    } finally {
      if (request.current === controller) {
        setBusy(false);
        if (!bindingStarted) request.current = null;
      }
    }
  };
  const cancel = () => {
    request.current?.abort();
    request.current = null;
    setPendingBinding(null);
    setBindingTime(null);
    setBusy(false);
    record('cancel', { clearedRows: true });
  };

  const onSort = (value: readonly OwpDataGridSortItem[]) => {
    setSort(value);
    record('sort', value);
  };
  const onFilter = (value: readonly OwpDataGridFilterItem[]) => {
    setFilters(value);
    record('filter', value);
  };
  const onSelection = (value: readonly OwpDataGridRowId[]) => {
    setSelected(value);
    record('selection', { count: value.length, rowIds: value.slice(0, 50) });
  };
  const onRowsUpdate = useCallback((next: readonly Task[]) => {
    setRowCount(next.length);
  }, []);

  const retry = () => {
    setRows(initialTasks);
    setRowCount(initialTasks.length);
    setError(false);
    setLoading(false);
    record('retry', { count: initialTasks.length });
  };

  const changeState = (state: GridState) => {
    const next = gridStates[state];
    setRows(next.rows);
    setRowCount(next.rows.length);
    setLoading(next.loading);
    setError(next.error);
    setSelected([]);
    setChangeCount(0);
    record('state', state);
  };

  const state: GridState = loading ? 'loading' : error ? 'error' : rows.length ? 'ready' : 'empty';
  return {
    configuration,
    gridApi,
    rows,
    busy,
    setBusy,
    loading,
    setLoading,
    error,
    setError,
    events,
    setEvents,
    selected,
    sort,
    filters,
    changeCount,
    rowCount,
    gridVersion,
    pendingBinding,
    bindingTime,
    finishBinding,
    columns: configuration.columns,
    record,
    onChanges,
    reset,
    generate,
    cancel,
    onSort,
    onFilter,
    onSelection,
    onRowsUpdate,
    retry,
    changeState,
    state,
  };
}

export type GridController = ReturnType<typeof useGridController>;
