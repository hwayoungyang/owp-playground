import type { ReleaseIndexEntry } from './schema';

type VersionNavigation = {
  readonly currentHref: string;
  readonly release: ReleaseIndexEntry;
  readonly packageId: string;
  readonly apiIds?: ReadonlySet<string>;
  readonly sampleIds?: ReadonlySet<string>;
  readonly language: string;
  readonly colorMode: 'light' | 'dark';
};

export function createVersionUrl(options: VersionNavigation): URL {
  const url = new URL(options.currentHref);
  url.pathname = options.release.basePath;
  url.searchParams.set('package', options.packageId);
  url.searchParams.set('lang', options.language === 'en' ? 'en' : 'ko');
  url.searchParams.set('colorMode', options.colorMode);
  const symbol = url.searchParams.get('symbol');
  if (symbol && options.apiIds && !options.apiIds.has(symbol)) url.searchParams.delete('symbol');
  const sample = url.searchParams.get('sample');
  if (sample && options.sampleIds && !options.sampleIds.has(sample)) {
    url.searchParams.delete('sample');
    url.hash = '';
  }
  for (const key of ['file', 'line', 'endLine']) url.searchParams.delete(key);
  return url;
}
