import type { OwpDataGridFilterItem, OwpDataGridSortItem } from '@owp/datagrid/types';
import { initialTasks, type Task } from './data';

const fields: Readonly<Record<string, keyof Task>> = {
  project: 'project',
  task: 'task',
  owner: 'owner',
  status: 'status',
  quantity: 'quantity',
  completed: 'completed',
  date: 'date',
};
const readValue = (row: Task, columnId: string): unknown => {
  const field = fields[columnId];
  return field ? row[field] : undefined;
};

export function loadRows(
  rows: readonly Task[],
  signal: AbortSignal,
  delay = 350,
): Promise<readonly Task[]> {
  return new Promise((resolve) => {
    const finish = (result: readonly Task[]) => {
      signal.removeEventListener('abort', abort);
      resolve(result);
    };
    const timer = setTimeout(() => finish(rows), delay);
    const abort = () => {
      clearTimeout(timer);
      finish([]);
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}

export function saveTasks(rows: readonly Task[], signal: AbortSignal) {
  return loadRows(
    rows.map((row) => ({ ...row, task: row.task.trim(), note: '서버 저장 완료' })),
    signal,
    800,
  );
}

function matches(row: Task, filter: OwpDataGridFilterItem): boolean {
  if (filter.enabled === false) return true;
  const raw = readValue(row, filter.columnId);
  const left = String(raw).toLocaleLowerCase();
  const right = String(filter.value).toLocaleLowerCase();
  switch (filter.operator) {
    case 'contains':
      return left.includes(right);
    case 'notContains':
      return !left.includes(right);
    case 'equals':
      return left === right;
    case 'notEquals':
      return left !== right;
    case 'startsWith':
      return left.startsWith(right);
    case 'endsWith':
      return left.endsWith(right);
    case 'lessThan':
      return typeof raw === 'number' ? raw < Number(filter.value) : left < right;
    case 'lessThanOrEqual':
      return typeof raw === 'number' ? raw <= Number(filter.value) : left <= right;
    case 'greaterThan':
      return typeof raw === 'number' ? raw > Number(filter.value) : left > right;
    case 'greaterThanOrEqual':
      return typeof raw === 'number' ? raw >= Number(filter.value) : left >= right;
    default:
      return assertNever(filter.operator);
  }
}

function assertNever(value: never): never {
  throw new TypeError(`Unsupported filter: ${String(value)}`);
}

export function queryTasks(
  sort: readonly OwpDataGridSortItem[],
  filters: readonly OwpDataGridFilterItem[],
  signal: AbortSignal,
) {
  const rows = initialTasks
    .filter((row) => filters.every((filter) => matches(row, filter)))
    .sort((left, right) => {
      for (const item of sort) {
        const a = readValue(left, item.columnId);
        const b = readValue(right, item.columnId);
        const result =
          typeof a === 'number' && typeof b === 'number'
            ? a - b
            : String(a).localeCompare(String(b), 'ko');
        if (result !== 0) return item.direction === 'asc' ? result : -result;
      }
      return 0;
    });
  return loadRows(rows, signal);
}
