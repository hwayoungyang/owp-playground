import { describe, expect, it } from 'vitest';
import {
  createNestedTree,
  createTasks,
  createTree,
  generateTasks,
} from '../src/playgrounds/datagrid/model/data';
import { queryTasks } from '../src/playgrounds/datagrid/model/server';

describe('generic sample data', () => {
  it('keeps stable unique identities across generated batches', async () => {
    const controller = new AbortController();
    const rows = await generateTasks(12001, controller.signal);
    expect(rows?.length).toBe(12001);
    expect(new Set(rows?.map((row) => row.id)).size).toBe(12001);
    expect(rows?.at(-1)?.id).toBe('task-12001');
  });
  it('returns no replacement dataset when generation is cancelled', async () => {
    const controller = new AbortController();
    const pending = generateTasks(100000, controller.signal);
    controller.abort();
    expect(await pending).toBeNull();
  });
  it('builds a tree whose children resolve to existing project rows', () => {
    const rows = createTree();
    const parents = new Set(rows.filter((row) => row.parentId === null).map((row) => row.id));
    expect(parents.size).toBe(3);
    expect(
      rows.filter((row) => row.parentId !== null).every((row) => parents.has(row.parentId ?? '')),
    ).toBe(true);
    expect(rows.length).toBe(15);
  });
  it('reproduces the same fixture without mutable shared rows', () => {
    const first = createTasks(12);
    const second = createTasks(12);
    expect(second).toEqual(first);
    expect(second[0]).not.toBe(first[0]);
  });
  it('builds four nested levels with distinct identities', () => {
    const roots = createNestedTree();
    const phases = roots.flatMap((row) => row.children ?? []);
    const work = phases.flatMap((row) => row.children ?? []);
    const steps = work.flatMap((row) => row.children ?? []);
    const rows = [...roots, ...phases, ...work, ...steps];
    expect([roots.length, phases.length, work.length, steps.length]).toEqual([3, 6, 12, 24]);
    expect(new Set(rows.map((row) => row.id)).size).toBe(45);
    expect(steps.every((row) => row.children === undefined)).toBe(true);
  });
});

describe('simulated server processing', () => {
  it('filters by status before applying numeric descending sort', async () => {
    const rows = await queryTasks(
      [{ columnId: 'quantity', direction: 'desc' }],
      [{ columnId: 'status', operator: 'equals', value: '완료' }],
      new AbortController().signal,
    );
    expect(rows.map((row) => row.id)).toEqual(['task-10', 'task-2', 'task-6']);
  });
  it('releases an aborted detail or server query without publishing rows', async () => {
    const controller = new AbortController();
    const pending = queryTasks([], [], controller.signal);
    controller.abort();
    expect(await pending).toEqual([]);
  });
});
