import { describe, expect, it } from 'vitest';
import { createPlaygroundUrl, readPlaygroundRoute } from '../src/playgrounds/registry';

describe('shared playground URLs', () => {
  it('opens the requested package and sample from query parameters', () => {
    const route = readPlaygroundRoute('?package=datagrid&sample=auto-span');
    expect(route.playground.id).toBe('datagrid');
    expect(route.example?.id).toBe('auto-span');
  });

  it('keeps sample-only links usable', () => {
    const route = readPlaygroundRoute('?sample=editing');
    expect(route.playground.id).toBe('datagrid');
    expect(route.example?.id).toBe('editing');
  });

  it.each([
    ['', 'core'],
    ['?lang=en', 'core'],
    ['?package=unknown', 'core'],
    ['?package=datagrid&sample=unknown', 'datagrid'],
  ])('opens a usable default when the URL is %s', (search, packageId) => {
    const route = readPlaygroundRoute(search);
    expect(route.playground.id).toBe(packageId);
    expect(route.example?.id).toBe('getting-started');
  });

  it('accepts a scoped package name as a shared URL value', () => {
    const route = readPlaygroundRoute('?package=%40owp%2Fpdf');
    expect(route.playground.id).toBe('pdf');
    expect(route).toMatchObject({ status: 'package-guide', example: { id: 'getting-started' } });
  });

  it('shows the installed package API without an unrelated sample', () => {
    const route = readPlaygroundRoute('?package=pdf&sample=editing');
    expect(route.playground.id).toBe('pdf');
    expect(route.example?.id).toBe('exports');
    expect(route.status).toBe('exports');
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

  it('opens Tailwind getting started when choosing the configured package', () => {
    const url = createPlaygroundUrl(
      'https://playground.example/?package=datagrid&sample=editing',
      readPlaygroundRoute('?package=tailwind-config'),
    );
    expect(url.searchParams.get('package')).toBe('tailwind-config');
    expect(url.searchParams.get('sample')).toBe('getting-started');
  });
});
