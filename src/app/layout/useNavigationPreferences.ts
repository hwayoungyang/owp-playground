import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  navigationUsesSessionStorage,
  parseNavigationPreferences,
  readNavigationSnapshot,
  subscribeNavigationPreferences,
  updateNavigationPreferences,
} from './navigation-preferences';

const serverSnapshot = () => '';

export function useNavigationPreferences(
  packageId: string,
  availableIds: ReadonlySet<string>,
  currentId?: string,
) {
  const getSnapshot = useCallback(() => readNavigationSnapshot(packageId), [packageId]);
  const snapshot = useSyncExternalStore(
    subscribeNavigationPreferences,
    getSnapshot,
    serverSnapshot,
  );
  const preferences = useMemo(
    () => parseNavigationPreferences(snapshot, availableIds),
    [snapshot, availableIds],
  );
  useEffect(() => {
    if (currentId) updateNavigationPreferences({ packageId, id: currentId, action: 'visit' });
  }, [packageId, currentId]);
  return {
    ...preferences,
    temporary: navigationUsesSessionStorage(packageId),
    toggleFavorite: () => {
      if (currentId)
        updateNavigationPreferences({ packageId, id: currentId, action: 'favorite', availableIds });
    },
  };
}
