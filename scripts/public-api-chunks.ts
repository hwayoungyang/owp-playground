import { Buffer } from 'node:buffer';
import type { PublicApiEntry } from '../src/features/public-api/types.ts';

export function splitPublicApiEntries(
  entries: readonly PublicApiEntry[],
  maxBytes = 64 * 1024,
): readonly (readonly PublicApiEntry[])[] {
  const chunks: PublicApiEntry[][] = [];
  let chunk: PublicApiEntry[] = [];
  let bytes = 2;
  for (const entry of entries) {
    const entryBytes = Buffer.byteLength(JSON.stringify(entry.id)) + 1 + Buffer.byteLength(JSON.stringify(entry));
    if (chunk.length && bytes + 1 + entryBytes > maxBytes) {
      chunks.push(chunk);
      chunk = [];
      bytes = 2;
    }
    bytes += (chunk.length ? 1 : 0) + entryBytes;
    chunk.push(entry);
  }
  if (chunk.length) chunks.push(chunk);
  return chunks;
}
