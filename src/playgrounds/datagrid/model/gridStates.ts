import { initialTasks } from './data';

export const gridStates = {
  ready: { rows: initialTasks, loading: false, error: false },
  loading: { rows: initialTasks, loading: true, error: false },
  empty: { rows: [], loading: false, error: false },
  error: { rows: [], loading: false, error: true },
} as const;

export type GridState = keyof typeof gridStates;
