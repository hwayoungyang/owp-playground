import type { ReleaseIndexEntry } from './schema';

export function selectPackageVersionEntries(
  releases: readonly ReleaseIndexEntry[],
  packageId: string,
): readonly ReleaseIndexEntry[] {
  const versions = new Set<string>();
  return releases
    .toSorted((left, right) => {
      const timeDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt);
      if (timeDifference !== 0) return timeDifference;
      if (left.releaseId === right.releaseId) return 0;
      return left.releaseId < right.releaseId ? 1 : -1;
    })
    .filter((entry) => {
      const version = entry.packages.find((item) => item.id === packageId)?.version;
      if (!version || versions.has(version)) return false;
      versions.add(version);
      return true;
    });
}

export function formatReleaseDate(createdAt: string, language: string): string {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ko-KR', {
    dateStyle: 'medium',
    timeZone: 'Asia/Seoul',
  }).format(new Date(createdAt));
}
