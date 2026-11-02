import { z } from 'zod';

const schema = z.object({
  version: z.literal(1),
  recent: z.array(z.string().min(1)).max(100),
  favorites: z.array(z.string().min(1)).max(100),
});
export type NavigationPreferences = {
  readonly recent: readonly string[];
  readonly favorites: readonly string[];
};
const empty: NavigationPreferences = { recent: [], favorites: [] };
const sessionValues = new Map<string, string>();
const changeEvent = 'owp-navigation-preferences';
export const favoriteLimit = 12;
const key = (packageId: string) => `owp-playground.navigation.v1.${packageId}`;

export function parseNavigationPreferences(
  raw: string,
  availableIds?: ReadonlySet<string>,
): NavigationPreferences {
  if (!raw) return empty;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success
      ? {
          recent: [...new Set(parsed.data.recent)]
            .slice(0, 8)
            .filter((id) => !availableIds || availableIds.has(id)),
          favorites: [...new Set(parsed.data.favorites)]
            .slice(0, favoriteLimit)
            .filter((id) => !availableIds || availableIds.has(id)),
        }
      : empty;
  } catch (error) {
    if (error instanceof SyntaxError) return empty;
    throw error;
  }
}

function toggleFavorite(
  favorites: readonly string[],
  id: string,
  availableIds?: ReadonlySet<string>,
): readonly string[] {
  if (favorites.includes(id)) return favorites.filter((entry) => entry !== id);
  if (favorites.length < favoriteLimit) return [id, ...favorites];
  const unavailable = availableIds
    ? [...favorites].reverse().find((entry) => !availableIds.has(entry))
    : undefined;
  return unavailable === undefined
    ? favorites
    : [id, ...favorites.filter((entry) => entry !== unavailable)];
}

export function readNavigationSnapshot(packageId: string): string {
  if (typeof window === 'undefined') return '';
  const storageKey = key(packageId);
  const session = sessionValues.get(storageKey);
  if (session !== undefined) return session;
  try {
    return window.localStorage.getItem(storageKey) ?? '';
  } catch (error) {
    if (error instanceof Error) return '';
    throw error;
  }
}

export function subscribeNavigationPreferences(listener: () => void): () => void {
  const storageChanged = (event: StorageEvent) => {
    if (event.key === null) sessionValues.clear();
    else if (event.key.startsWith('owp-playground.navigation.v1.')) sessionValues.delete(event.key);
    else return;
    listener();
  };
  window.addEventListener('storage', storageChanged);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener('storage', storageChanged);
    window.removeEventListener(changeEvent, listener);
  };
}

export function updateNavigationPreferences({
  packageId,
  id,
  action,
  availableIds,
}: {
  readonly packageId: string;
  readonly id: string;
  readonly action: 'visit' | 'favorite';
  readonly availableIds?: ReadonlySet<string>;
}): void {
  const previous = parseNavigationPreferences(readNavigationSnapshot(packageId));
  const next =
    action === 'visit'
      ? {
          ...previous,
          recent: [id, ...previous.recent.filter((entry) => entry !== id)].slice(0, 8),
        }
      : {
          ...previous,
          favorites: toggleFavorite(previous.favorites, id, availableIds),
        };
  const raw = JSON.stringify({ version: 1, ...next });
  if (readNavigationSnapshot(packageId) === raw) return;
  const storageKey = key(packageId);
  try {
    window.localStorage.setItem(storageKey, raw);
    sessionValues.delete(storageKey);
  } catch (error) {
    if (error instanceof Error) sessionValues.set(storageKey, raw);
    else throw error;
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function navigationUsesSessionStorage(packageId: string): boolean {
  return sessionValues.has(key(packageId));
}
