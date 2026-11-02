import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  parseRecentVisits,
  readRecentVisitSnapshot,
  recentVisitStorageKey,
  recentVisitsUseSessionStorage,
  recordRecentVisit,
  subscribeRecentVisits,
} from '../src/app/layout/recent-visits';

function storageWindow(rejectWrites = false) {
  const values = new Map<string, string>();
  return Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (rejectWrites) throw new DOMException('Storage unavailable', 'SecurityError');
        values.set(key, value);
      },
    },
  });
}

beforeEach(() => {
  vi.stubGlobal('window', storageWindow());
  const unsubscribe = subscribeRecentVisits(vi.fn());
  window.dispatchEvent(Object.assign(new Event('storage'), { key: null }));
  unsubscribe();
});
afterEach(() => vi.unstubAllGlobals());

describe('global recent visits', () => {
  it.each([
    '',
    '{broken',
    '{"version":2,"visits":[]}',
    '{"version":1,"visits":[{"packageId":"core","id":7}]}',
    '{"version":1,"visits":[{"packageId":"","id":"page"}]}',
  ])('rejects malformed persisted records: %s', (raw) => {
    // Given / When / Then
    expect(parseRecentVisits(raw)).toEqual([]);
  });

  it('keeps identical page IDs in different packages distinct and moves a revisited page first', () => {
    // Given
    recordRecentVisit({ packageId: 'core', id: 'getting-started' });
    recordRecentVisit({ packageId: 'charts', id: 'getting-started' });
    recordRecentVisit({ packageId: 'datagrid', id: 'selection' });
    // When
    recordRecentVisit({ packageId: 'core', id: 'getting-started' });
    // Then
    expect(parseRecentVisits(readRecentVisitSnapshot())).toEqual([
      { packageId: 'core', id: 'getting-started' },
      { packageId: 'datagrid', id: 'selection' },
      { packageId: 'charts', id: 'getting-started' },
    ]);
  });

  it('bounds global history to the eight most recent distinct pages', () => {
    // Given / When
    for (let index = 0; index < 12; index += 1)
      recordRecentVisit({ packageId: 'core', id: `page-${index}` });
    // Then
    expect(parseRecentVisits(readRecentVisitSnapshot()).map((visit) => visit.id)).toEqual([
      'page-11',
      'page-10',
      'page-9',
      'page-8',
      'page-7',
      'page-6',
      'page-5',
      'page-4',
    ]);
  });

  it('imports ordered legacy visits once without modifying favorites', () => {
    // Given
    const key = 'owp-playground.navigation.v1.core';
    const favorites = '{"version":1,"recent":["older-page"],"favorites":["pinned-page"]}';
    window.localStorage.setItem(key, favorites);
    const legacy = [
      { packageId: 'core', id: 'older-page' },
      { packageId: 'charts', id: 'bar' },
    ];
    // When
    recordRecentVisit({ packageId: 'core', id: 'current-page' }, legacy);
    recordRecentVisit({ packageId: 'datagrid', id: 'selection' }, [
      { packageId: 'core', id: 'unrelated-legacy-page' },
    ]);
    // Then
    expect(parseRecentVisits(readRecentVisitSnapshot())).toEqual([
      { packageId: 'datagrid', id: 'selection' },
      { packageId: 'core', id: 'current-page' },
      ...legacy,
    ]);
    expect(window.localStorage.getItem(key)).toBe(favorites);
  });

  it('does not write or notify again for the already most recent page', () => {
    // Given
    const listener = vi.fn();
    const unsubscribe = subscribeRecentVisits(listener);
    recordRecentVisit({ packageId: 'core', id: 'page' });
    // When
    recordRecentVisit({ packageId: 'core', id: 'page' });
    // Then
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('observes only relevant cross-tab changes and removes listeners on unsubscribe', () => {
    // Given
    const listener = vi.fn();
    const unsubscribe = subscribeRecentVisits(listener);
    // When
    window.dispatchEvent(Object.assign(new Event('storage'), { key: 'unrelated' }));
    window.dispatchEvent(Object.assign(new Event('storage'), { key: recentVisitStorageKey }));
    unsubscribe();
    window.dispatchEvent(Object.assign(new Event('storage'), { key: recentVisitStorageKey }));
    recordRecentVisit({ packageId: 'core', id: 'page' });
    // Then
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps recent navigation usable in the current tab when storage rejects writes', () => {
    // Given
    vi.stubGlobal('window', storageWindow(true));
    // When
    recordRecentVisit({ packageId: 'core', id: 'first' });
    recordRecentVisit({ packageId: 'charts', id: 'second' });
    // Then
    expect(parseRecentVisits(readRecentVisitSnapshot())).toEqual([
      { packageId: 'charts', id: 'second' },
      { packageId: 'core', id: 'first' },
    ]);
    expect(recentVisitsUseSessionStorage()).toBe(true);
    expect(window.localStorage.getItem(recentVisitStorageKey)).toBeNull();
  });
});
