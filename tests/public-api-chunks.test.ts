import { describe, expect, it } from 'vitest';
import { splitPublicApiEntries } from '../scripts/public-api-chunks';
import type { PublicApiEntry } from '../src/features/public-api/types';

function entry(id: string, description = ''): PublicApiEntry {
  return {
    id,
    name: id,
    description,
    packageId: 'components',
    kind: 'type',
    group: 'types',
    modules: ['@owp/components/types'],
    owner: '@owp/components',
    imports: [],
    declaration: 'type Example = string;',
    propsVariants: [],
    signatures: [],
    valueType: 'string',
    examples: [],
    usage: '',
    usageKind: 'type',
  };
}

describe('API detail chunks', () => {
  it('preserves complete entries and keeps each ordinary chunk within its byte budget', () => {
    const entries = Array.from({ length: 7 }, (_, index) =>
      entry(`항목-${index}`, '가'.repeat(100)),
    );
    const chunks = splitPublicApiEntries(entries, 1600);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.flat()).toEqual(entries);
    for (const chunk of chunks) {
      const data = Object.fromEntries(chunk.map((item) => [item.id, item]));
      expect(Buffer.byteLength(JSON.stringify(data))).toBeLessThanOrEqual(1600);
    }
  });

  it('keeps an oversized entry whole without pulling neighboring entries into its chunk', () => {
    const large = entry('large', '문서'.repeat(2000));
    const chunks = splitPublicApiEntries([entry('before'), large, entry('after')], 1600);
    expect(chunks).toEqual([[entry('before')], [large], [entry('after')]]);
    expect(splitPublicApiEntries([])).toEqual([]);
  });
});
