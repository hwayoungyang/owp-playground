import type { ApiRecord } from './knowledge';

function memberGroup(record: ApiRecord): number {
  if (record.kind === 'method' || record.kind === 'event' || /^on[A-Z]/.test(record.name)) return 2;
  const signature = record.signature.trim().replace(/^\(([^()]*)\)$/, '$1');
  const parts = signature.split('|').map((part) => part.trim());
  return parts.some((part) => /^(?:boolean|true|false)$/.test(part)) &&
    parts.every((part) => /^(?:boolean|true|false|undefined)$/.test(part))
    ? 0
    : 1;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compareApiMembers(a: ApiRecord, b: ApiRecord): number {
  return (
    memberGroup(a) - memberGroup(b) ||
    compareText(a.name.toLowerCase(), b.name.toLowerCase()) ||
    compareText(a.name, b.name) ||
    compareText(a.id, b.id)
  );
}

export function descriptionOrigins(
  record: ApiRecord,
  records: ReadonlyMap<string, ApiRecord>,
): readonly ApiRecord[] {
  if (!record.description.trim()) return [];
  const found = new Map<string, ApiRecord>();
  const visited = new Set<string>();
  const pending = [record];
  while (pending.length > 0) {
    const current = pending.shift();
    if (!current || visited.has(current.id)) continue;
    visited.add(current.id);
    if (current.description.trim() !== record.description.trim()) continue;
    if (!current.package.startsWith('@owp/')) {
      found.set(current.id, current);
      continue;
    }
    for (const id of [current.declaredIn, ...(current.inheritedFrom ?? [])]) {
      const parent = id ? records.get(id) : undefined;
      if (parent) pending.push(parent);
    }
  }
  return [...found.values()];
}

export function filterRelatedRecords(
  records: readonly ApiRecord[],
  query: string,
): readonly ApiRecord[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return records.filter((record) => {
    const text =
      `${record.name} ${record.owner} ${record.path} ${record.package} ${record.description}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
