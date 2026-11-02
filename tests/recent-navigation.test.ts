import { describe, expect, it } from 'vitest';
import { resolveRecentNavigation } from '../src/app/layout/recent-navigation';

const baseUrl =
  'http://localhost:4185/releases/example/index.html?lang=ko&tab=code&file=old.ts&line=3';

describe('recent page links', () => {
  it('uses current catalog labels and the current archive path and language for an API', () => {
    // Given / When
    const entry = resolveRecentNavigation({
      visit: { packageId: 'core', id: 'export:@owp/core:createInstance' },
      baseUrl,
      language: 'en',
    });
    // Then
    expect(entry?.title).toBe('createInstance');
    expect(entry?.kind).toBe('Function');
    const url = new URL(entry?.href ?? baseUrl);
    expect(url.pathname).toBe('/releases/example/index.html');
    expect(url.searchParams.get('package')).toBe('core');
    expect(url.searchParams.get('sample')).toBe('export:@owp/core:createInstance');
    expect(url.searchParams.get('lang')).toBe('en');
    expect(url.searchParams.has('file')).toBe(false);
  });

  it.each([
    { packageId: 'unknown', id: 'page' },
    { packageId: 'core', id: 'deleted-page' },
    { packageId: 'core', id: 'export:@owp/core:deletedSymbol' },
  ])('omits unavailable pages instead of linking to a fallback: $packageId/$id', (visit) => {
    // Given / When / Then
    expect(resolveRecentNavigation({ visit, baseUrl, language: 'ko' })).toBeNull();
  });

  it('retains a consolidated chart configuration when reopening its recent page', () => {
    // Given / When
    const entry = resolveRecentNavigation({
      visit: { packageId: 'charts', id: 'grouped-bar' },
      baseUrl,
      language: 'ko',
    });
    // Then
    expect(entry?.route.status).toBe('charts');
    expect(new URL(entry?.href ?? baseUrl).searchParams.get('sample')).toBe('grouped-bar');
    expect(entry?.kind).toBe('예제');
  });

  it('resolves guides and valid legacy grid aliases without treating unknown pages as visits', () => {
    // Given / When
    const guide = resolveRecentNavigation({
      visit: { packageId: 'charts', id: 'getting-started' },
      baseUrl,
      language: 'ko',
    });
    const alias = resolveRecentNavigation({
      visit: { packageId: 'datagrid', id: 'visible-rows' },
      baseUrl,
      language: 'ko',
    });
    // Then
    expect(guide?.kind).toBe('가이드');
    expect(alias?.route.example?.id).toBe('overview');
  });
});
