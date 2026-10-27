import { describe, expect, it } from 'vitest';
import { createVersionUrl } from '../src/features/releases/model/navigation';
import {
  formatReleaseDate,
  selectPackageVersionEntries,
} from '../src/features/releases/model/presentation';
import {
  releaseIndexEntrySchema,
  type ReleaseIndexEntry,
  type ReleasePackage,
} from '../src/features/releases/model/schema';

function snapshot(
  releaseId: string,
  createdAt: string,
  packages: readonly ReleasePackage[],
): ReleaseIndexEntry {
  return releaseIndexEntrySchema.parse({
    releaseId,
    createdAt,
    packages,
    basePath: `/versions/${releaseId}/`,
    channel: 'stable',
    manifestSha256: '0'.repeat(64),
  });
}

const core = { id: 'core', name: '@owp/core', version: '10.2.0' } as const;
const datagrid = { id: 'datagrid', name: '@owp/datagrid', version: '3.5.3' } as const;
const olderDatagrid = { ...datagrid, version: '3.5.0' } as const;
const oldest = snapshot('first', '2026-10-25T03:00:00.000Z', [core, olderDatagrid]);
const middle = snapshot('middle', '2026-10-26T03:00:00.000Z', [core, datagrid]);
const latest = snapshot('latest', '2026-10-27T03:00:00.000Z', [core, datagrid]);

describe('version menu entries', () => {
  it('shows only the latest snapshot when the package version is repeated', () => {
    // Given
    const releases = [oldest, middle, latest];
    // When
    const entries = selectPackageVersionEntries(releases, 'core');
    // Then
    expect(entries).toEqual([latest]);
  });

  it('keeps separate versions of the selected package', () => {
    // Given
    const releases = [oldest, middle, latest];
    // When
    const entries = selectPackageVersionEntries(releases, 'datagrid');
    // Then
    expect(entries).toEqual([latest, oldest]);
  });

  it('does not let another package with the same version replace the selected package', () => {
    // Given
    const unrelated = snapshot('unrelated', '2026-10-28T03:00:00.000Z', [
      { id: 'charts', name: '@owp/charts', version: '10.2.0' },
    ]);
    const releases = [oldest, unrelated];
    // When
    const entries = selectPackageVersionEntries(releases, 'core');
    // Then
    expect(entries).toEqual([oldest]);
  });

  it('selects and orders representatives by creation time when the index is shuffled', () => {
    // Given
    const releases = [latest, oldest, middle];
    // When
    const entries = selectPackageVersionEntries(releases, 'datagrid');
    // Then
    expect(entries).toEqual([latest, oldest]);
  });

  it.each([false, true])(
    'breaks equal creation-time ties by release ID regardless of reversed input: %s',
    (reverse) => {
      // Given
      const tied = snapshot('z-latest', latest.createdAt, [core]);
      const releases = reverse ? [tied, latest] : [latest, tied];
      // When
      const entries = selectPackageVersionEntries(releases, 'core');
      // Then
      expect(entries).toEqual([tied]);
    },
  );

  it('preserves the source index and every snapshot when selecting entries', () => {
    // Given
    const releases = Object.freeze([latest, oldest, middle]);
    const before = structuredClone(releases);
    // When
    selectPackageVersionEntries(releases, 'datagrid');
    // Then
    expect(releases).toEqual(before);
  });

  it('returns an empty menu when no snapshot contains the selected package', () => {
    // Given
    const releases = [oldest, latest];
    // When
    const entries = selectPackageVersionEntries(releases, 'charts');
    // Then
    expect(entries).toEqual([]);
  });

  it('links an older fixed snapshot to the latest representative of the same package version', () => {
    // Given
    const currentHref =
      `https://owp.test${oldest.basePath}?package=core&sample=settings&tab=code` +
      '&lang=en&colorMode=dark&file=old.ts&line=12';
    const entries = selectPackageVersionEntries([oldest, middle, latest], 'core');
    // When
    const links = entries.map((release) => ({
      selected: release.releaseId === oldest.releaseId,
      url: createVersionUrl({
        currentHref,
        release,
        packageId: 'core',
        language: 'en',
        colorMode: 'dark',
        apiIds: new Set(),
        sampleIds: new Set(['settings']),
      }),
    }));
    // Then
    expect(links).toHaveLength(1);
    expect(links[0]?.selected).toBe(false);
    expect(links[0]?.url.pathname).toBe(latest.basePath);
    expect(Object.fromEntries(links[0]?.url.searchParams ?? [])).toEqual({
      package: 'core',
      sample: 'settings',
      tab: 'code',
      lang: 'en',
      colorMode: 'dark',
    });
  });
});

describe('version menu dates', () => {
  it.each([
    ['2026-10-27T14:59:59.000Z', 'ko', '2026. 10. 27.'],
    ['2026-10-27T15:00:00.000Z', 'ko', '2026. 10. 28.'],
    ['2026-10-27T14:59:59.000Z', 'en', 'Oct 27, 2026'],
    ['2026-10-27T15:00:00.000Z', 'en', 'Oct 28, 2026'],
  ])('shows only the Korean-time date for %s in %s', (createdAt, language, expected) => {
    // Given / When
    const date = formatReleaseDate(createdAt, language);
    // Then
    expect(date).toBe(expected);
  });
});
