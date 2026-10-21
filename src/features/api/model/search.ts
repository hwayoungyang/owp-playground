import type { ApiRecord } from './knowledge';

export function matchesApiQuery(record: ApiRecord, query: string): boolean {
  const words = query.trim().toLocaleLowerCase().split(/\s+/);
  const text = [
    record.id,
    record.name,
    record.description,
    record.documentation,
    record.body,
    record.signature,
    record.defaultDescription,
    ...(record.typeDetails?.values ?? []),
  ]
    .join(' ')
    .toLocaleLowerCase();
  return words.every((word) => text.includes(word));
}
