import { describe, expect, it } from 'vitest';
import { createPlaygroundUrl, readPlaygroundRoute } from '../src/playgrounds/registry';

describe('shared playground URLs', () => {
  it('opens the requested package and sample from query parameters', () => {
    const route = readPlaygroundRoute('?package=datagrid&sample=auto-span');
    expect(route.playground.id).toBe('datagrid');
    expect(route.sample?.id).toBe('auto-span');
  });

  it('keeps sample-only links usable', () => {
    const route = readPlaygroundRoute('?sample=editing');
    expect(route.playground.id).toBe('datagrid');
    expect(route.sample?.id).toBe('editing');
  });

  it.each(['', '?package=unknown', '?package=datagrid&sample=unknown'])(
    'opens a usable default when the URL is %s',
    (search) => {
      const route = readPlaygroundRoute(search);
      expect(route.playground.id).toBe('datagrid');
      expect(route.sample?.id).toBe('getting-started');
    },
  );

  it('accepts a scoped package name as a shared URL value', () => {
    const route = readPlaygroundRoute('?package=%40owp%2Fpdf');
    expect(route.playground.id).toBe('pdf');
    expect(route.sample).toBeNull();
  });

  it('shows the selected planned package without an unrelated sample', () => {
    const route = readPlaygroundRoute('?package=pdf&sample=editing');
    expect(route.playground.id).toBe('pdf');
    expect(route.sample).toBeNull();
    expect(route.status).toBe('planned');
  });

  it('preserves other query values and the fragment when choosing a sample', () => {
    const url = createPlaygroundUrl(
      'https://playground.example/demo?ref=docs&package=pdf#main-content',
      readPlaygroundRoute('?package=datagrid&sample=auto-span'),
    );
    expect(url.pathname).toBe('/demo');
    expect(url.searchParams.get('ref')).toBe('docs');
    expect(url.searchParams.get('package')).toBe('datagrid');
    expect(url.searchParams.get('sample')).toBe('auto-span');
    expect(url.hash).toBe('#main-content');
  });

  it('clears the previous sample when choosing a planned package', () => {
    const url = createPlaygroundUrl(
      'https://playground.example/?package=datagrid&sample=editing',
      readPlaygroundRoute('?package=components'),
    );
    expect(url.searchParams.get('package')).toBe('components');
    expect(url.searchParams.has('sample')).toBe(false);
  });
});
