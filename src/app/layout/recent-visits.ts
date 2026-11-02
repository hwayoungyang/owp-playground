import { z } from 'zod';

const visitSchema = z.object({ packageId: z.string().min(1), id: z.string().min(1) });
const schema = z.object({ version: z.literal(1), visits: z.array(visitSchema).max(100) });
export type RecentVisit = Readonly<z.infer<typeof visitSchema>>;
export const recentVisitLimit = 8;
export const recentVisitStorageKey = 'owp-playground.recent.v1';
const changeEvent = 'owp-recent-visits';
let sessionSnapshot: string | undefined;

export const recentVisitKey = (visit: RecentVisit): string =>
  JSON.stringify([visit.packageId, visit.id]);

function uniqueVisits(visits: readonly RecentVisit[]): readonly RecentVisit[] {
  const seen = new Set<string>();
  return visits
    .filter((visit) => {
      const key = recentVisitKey(visit);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, recentVisitLimit);
}

export function parseRecentVisits(raw: string): readonly RecentVisit[] {
  if (!raw) return [];
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? uniqueVisits(parsed.data.visits) : [];
  } catch (error) {
    if (error instanceof SyntaxError) return [];
    throw error;
  }
}

export function readRecentVisitSnapshot(): string {
  if (typeof window === 'undefined') return '';
  if (sessionSnapshot !== undefined) return sessionSnapshot;
  try {
    return window.localStorage.getItem(recentVisitStorageKey) ?? '';
  } catch (error) {
    if (error instanceof Error) return '';
    throw error;
  }
}

export function recordRecentVisit(
  visit: RecentVisit,
  legacyVisits: readonly RecentVisit[] = [],
): void {
  const snapshot = readRecentVisitSnapshot();
  const previous = snapshot ? parseRecentVisits(snapshot) : legacyVisits;
  const visits = uniqueVisits([visit, ...previous]);
  const raw = JSON.stringify({ version: 1, visits });
  if (raw === snapshot) return;
  try {
    window.localStorage.setItem(recentVisitStorageKey, raw);
    sessionSnapshot = undefined;
  } catch (error) {
    if (error instanceof Error) sessionSnapshot = raw;
    else throw error;
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function subscribeRecentVisits(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== recentVisitStorageKey) return;
    sessionSnapshot = undefined;
    listener();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(changeEvent, listener);
  };
}

export function recentVisitsUseSessionStorage(): boolean {
  return sessionSnapshot !== undefined;
}
