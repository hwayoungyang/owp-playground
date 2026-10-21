import links from '../data/links.generated.json';

export type ApiLink = {
  readonly id: string;
  readonly label: string;
  readonly packageId: string;
};

const references: Readonly<Record<string, readonly ApiLink[]>> = links;

export function exampleApiLinks(packageId: string, exampleId: string): readonly ApiLink[] {
  return (references[`${packageId}/${exampleId}`] ?? []).filter(
    (reference) => !reference.id.split('.').at(-1)?.startsWith('aria-'),
  );
}

export function apiHref(packageId: string, symbol?: string): string {
  const query = new URLSearchParams({ package: packageId, view: 'api' });
  if (symbol) query.set('symbol', symbol);
  return `?${query}`;
}
