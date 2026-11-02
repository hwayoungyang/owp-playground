import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { packageCatalog } from '../../playgrounds/packages';
import { parseNavigationPreferences, readNavigationSnapshot } from './navigation-preferences';
import {
  parseRecentVisits,
  readRecentVisitSnapshot,
  recentVisitsUseSessionStorage,
  recordRecentVisit,
  subscribeRecentVisits,
} from './recent-visits';
import type { RecentVisit } from './recent-visits';

const serverSnapshot = () => '';

export function useRecentVisits(visit: RecentVisit | undefined) {
  const snapshot = useSyncExternalStore(
    subscribeRecentVisits,
    readRecentVisitSnapshot,
    serverSnapshot,
  );
  const visits = useMemo(() => parseRecentVisits(snapshot), [snapshot]);
  const packageId = visit?.packageId;
  const id = visit?.id;
  useEffect(() => {
    if (!packageId || !id) return;
    const packages = [
      packageId,
      ...packageCatalog.map((entry) => entry.id).filter((entry) => entry !== packageId),
    ];
    const legacy = readRecentVisitSnapshot()
      ? []
      : packages.flatMap((previousPackage) =>
          parseNavigationPreferences(readNavigationSnapshot(previousPackage)).recent.map(
            (previousId) => ({ packageId: previousPackage, id: previousId }),
          ),
        );
    recordRecentVisit({ packageId, id }, legacy);
  }, [packageId, id]);
  return { visits, temporary: recentVisitsUseSessionStorage() };
}
