import { describe, expect, it } from 'vitest';
import { createVersionUrl } from '../src/features/releases/model/navigation';
import { releaseIndexEntrySchema } from '../src/features/releases/model/schema';
import {
  isSamePlaygroundDocument,
  markdownWithPublicBase,
} from '../src/features/releases/model/urls';

const release = releaseIndexEntrySchema.parse({
  releaseId: '20261023-120000-0123456789ab',
  createdAt: '2026-10-23T03:00:00.000Z',
  basePath: '/versions/20261023-120000-0123456789ab/',
  channel: 'stable',
  packages: [{ id: 'datagrid', name: '@owp/datagrid', version: '3.5.0' }],
  manifestSha256: '0'.repeat(64),
});

describe('version navigation', () => {
  it('uses the current menu fingerprint in native links to bypass previously cached archive HTML', () => {
    // Given
    const currentHref = 'https://owp.test/?package=datagrid&sample=editing&versionUi=previous';
    // When
    const url = createVersionUrl({
      currentHref,
      release,
      packageId: 'datagrid',
      language: 'en',
      colorMode: 'dark',
      presentationId: 'current-runtime',
    });
    // Then
    expect(url.searchParams.get('versionUi')).toBe('current-runtime');
    expect(url.searchParams.get('sample')).toBe('editing');
    expect(url.pathname).toBe(release.basePath);
  });
  it('preserves example and API selections in native links before target metadata is loaded', () => {
    // Given
    const currentHref =
      'https://owp.test/?package=datagrid&sample=editing&view=api&symbol=@owp%2Fdatagrid%3AOwpDataGrid&file=old.ts&line=12';
    // When
    const url = createVersionUrl({
      currentHref,
      release,
      packageId: 'datagrid',
      language: 'en',
      colorMode: 'dark',
    });
    // Then
    expect(Object.fromEntries(url.searchParams)).toEqual({
      package: 'datagrid',
      sample: 'editing',
      view: 'api',
      symbol: '@owp/datagrid:OwpDataGrid',
      lang: 'en',
      colorMode: 'dark',
    });
  });

  it.each(['sample=editing', 'view=api&symbol=@owp%2Fdatagrid%3AOwpDataGrid'])(
    'uses the same native and verified link when %s exists in the target release',
    (selection) => {
      // Given
      const navigation = {
        currentHref: `https://owp.test/?package=datagrid&${selection}`,
        release,
        packageId: 'datagrid',
        language: 'en',
        colorMode: 'dark',
      } as const;
      // When
      const links = [
        createVersionUrl(navigation).href,
        createVersionUrl({
          ...navigation,
          apiIds: new Set(['@owp/datagrid:OwpDataGrid']),
          sampleIds: new Set(['editing']),
        }).href,
      ];
      // Then
      expect(links[0]).toBe(links[1]);
    },
  );

  it('loads the selected document while preserving an available example and user preferences', () => {
    // Given
    const currentHref =
      'https://owp.test/versions/older/?package=datagrid&sample=editing&tab=code&file=old.ts&line=12&endLine=18&custom=1#code';
    // When
    const url = createVersionUrl({
      currentHref,
      release,
      packageId: 'datagrid',
      apiIds: new Set(),
      sampleIds: new Set(['editing']),
      language: 'en',
      colorMode: 'dark',
    });
    // Then
    expect(url.pathname).toBe(release.basePath);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      package: 'datagrid',
      sample: 'editing',
      tab: 'code',
      custom: '1',
      lang: 'en',
      colorMode: 'dark',
    });
    expect(isSamePlaygroundDocument(url.href, currentHref)).toBe(false);
  });

  it('falls back to the selected package when the previous example is unavailable', () => {
    // Given
    const currentHref = 'https://owp.test/?package=datagrid&sample=removed#removed';
    // When
    const url = createVersionUrl({
      currentHref,
      release,
      packageId: 'datagrid',
      apiIds: new Set(),
      sampleIds: new Set(['editing']),
      language: 'ko',
      colorMode: 'light',
    });
    // Then
    expect(url.searchParams.has('sample')).toBe(false);
    expect(url.hash).toBe('');
  });

  it('clears a removed API symbol but preserves the API browser', () => {
    // Given
    const currentHref = 'https://owp.test/?package=datagrid&view=api&symbol=removed';
    // When
    const url = createVersionUrl({
      currentHref,
      release,
      packageId: 'datagrid',
      apiIds: new Set(['@owp/datagrid:OwpDataGrid']),
      sampleIds: new Set(),
      language: 'ko',
      colorMode: 'light',
    });
    // Then
    expect(url.searchParams.get('view')).toBe('api');
    expect(url.searchParams.has('symbol')).toBe(false);
  });

  it('keeps SPA navigation only within the same origin and version document', () => {
    // Given
    const current = `https://owp.test${release.basePath}?package=datagrid`;
    // When
    const decisions = ['?view=api', '/?package=charts', 'https://external.test/'].map((href) =>
      isSamePlaygroundDocument(href, current),
    );
    // Then
    expect(decisions).toEqual([true, false, false]);
  });

  it('projects Markdown links without changing executable code or external URLs', () => {
    // Given
    const input =
      '[API](/?view=api)\n[External](https://owp.test/)\n```tsx\nconst link = "[API](/?view=api)";\n```';
    // When
    const projected = markdownWithPublicBase(input, release.basePath);
    // Then
    expect(projected).toBe(
      `[API](${release.basePath}?view=api)\n[External](https://owp.test/)\n\`\`\`tsx\nconst link = "[API](/?view=api)";\n\`\`\``,
    );
  });
});
