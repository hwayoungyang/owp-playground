import { describe, expect, it } from 'vitest';
import { knowledgeAssets } from '../scripts/knowledge-resources';
import data from '../src/features/api/data/knowledge.generated.json';
import { packageKnowledgeSchema } from '../src/features/api/model/schema';

const basePath = '/versions/20261023-120000-0123456789ab/';

describe('versioned knowledge assets', () => {
  it('keeps APIs and example links inside the same immutable snapshot and recomputes content hashes', () => {
    // Given
    const original = packageKnowledgeSchema.parse(
      JSON.parse(knowledgeAssets().get('api/datagrid.json') ?? 'null'),
    );
    // When
    const archived = packageKnowledgeSchema.parse(
      JSON.parse(knowledgeAssets(data, basePath).get('api/datagrid.json') ?? 'null'),
    );
    // Then
    expect(archived.version).toBe(original.version);
    expect(archived.records.length).toBeGreaterThan(0);
    for (const [index, record] of archived.records.entries()) {
      expect(record.url.startsWith(basePath)).toBe(true);
      expect(record.contentHash).not.toBe(original.records[index]?.contentHash);
      expect(record.source).toEqual(original.records[index]?.source);
      for (const example of record.examples) {
        expect(example.url.startsWith(basePath)).toBe(true);
        expect(example.codeUrl.startsWith(basePath)).toBe(true);
        expect(example.entrypoint.startsWith(`${basePath}snippets/`)).toBe(true);
      }
    }
  });

  it('exports versioned guide and discovery links without advertising planned packages', () => {
    // Given
    const assets = knowledgeAssets(data, basePath);
    // When
    const discovery = assets.get('llms.txt') ?? '';
    const guides = [...assets].filter(([file]) => file.endsWith('.md'));
    // Then
    expect(discovery).toContain(`](${basePath}api/datagrid.json)`);
    expect(discovery).toContain(`](${basePath}api/charts.json)`);
    expect(discovery).not.toContain('api/components.json');
    expect(guides.length).toBeGreaterThan(0);
    for (const [, markdown] of guides) {
      expect(markdown).toContain(`Canonical URL: ${basePath}`);
      expect(markdown).not.toMatch(/\]\(\/(?:\?|snippets\/|knowledge\/)/);
    }
  });
});
