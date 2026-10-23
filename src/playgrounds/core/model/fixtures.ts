import processes from '../data/processes.json';
import emptyProcesses from '../data/processes-empty.json';
import failedProcesses from '../data/processes-error.json';

export const queryFixtures = {
  rows: processes,
  empty: emptyProcesses,
  error: failedProcesses,
} as const;
export const queryFixture = queryFixtures.rows;

export type QueryFixtureItem = (typeof queryFixture.resultData)[number];

export const exampleRows = [
  { name: '항목 A', status: '사용' },
  { name: '항목 B', status: '사용' },
  { name: '항목 C', status: '미사용' },
] as const;

export const commonCodeGroup = 'PLAYGROUND_CORE_PROCESS_710';
