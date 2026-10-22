import type { ApiRecord } from './knowledge';

const searchText = new WeakMap<ApiRecord, string>();

export function normalizeApiQuery(query: string): readonly string[] {
  const normalized = query.trim().toLocaleLowerCase();
  return normalized ? normalized.split(/\s+/) : [];
}

export function matchesApiQueryWords(record: ApiRecord, words: readonly string[]): boolean {
  if (words.length === 0) return true;
  let text = searchText.get(record);
  if (text === undefined) {
    text = [
      record.id,
      record.name,
      record.description,
      record.documentation,
      record.body,
      record.signature,
      record.defaultDescription,
      ...(record.typeDetails?.values ?? []),
    ].join(' ').toLocaleLowerCase();
    searchText.set(record, text);
  }
  return words.every((word) => text.includes(word));
}

export function matchesApiQuery(record: ApiRecord, query: string): boolean {
  return matchesApiQueryWords(record, normalizeApiQuery(query));
}
