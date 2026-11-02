import type { ComponentsApiEntry } from './types';

export const componentsApiGroups = [
  { id: 'components', label: 'Components' },
  { id: 'hooks', label: 'Hooks' },
  { id: 'utils', label: 'Utils' },
] as const;

export function filterComponentsApiEntries(
  entries: readonly ComponentsApiEntry[],
  search: string,
): readonly ComponentsApiEntry[] {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return entries;
  return entries.filter((entry) =>
    [entry.name, entry.description, ...entry.imports].some((text) =>
      text.toLocaleLowerCase().includes(query),
    ),
  );
}

export function componentsApiHref(symbol: string | null, language: string): string {
  const params = new URLSearchParams({ package: 'components', view: 'api' });
  if (symbol !== null) params.set('symbol', symbol);
  params.set('lang', language);
  return `?${params}`;
}
