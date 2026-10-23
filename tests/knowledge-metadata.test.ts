import { describe, expect, it } from 'vitest';
import { knowledgeAssets } from '../scripts/knowledge-resources';
import data from '../src/features/api/data/knowledge.generated.json';
import { knowledge } from './fixtures/api-knowledge';

const guides = knowledge.records.filter((record) => record.kind === 'guide');

describe('standalone guide metadata', () => {
  it('retains each guide identity, content hash and authoring source in its Markdown export', () => {
    // Given
    expect(guides.length).toBeGreaterThan(0);

    // When
    const assets = knowledgeAssets();

    // Then
    for (const guide of guides) {
      const markdown = assets.get(
        `knowledge/guides/${guide.package.replace('@owp/', '')}/${guide.path.replace('guide.', '')}.md`,
      );
      expect(markdown).toContain(`Record ID: ${guide.id}\n`);
      expect(markdown).toContain(`Content hash: ${guide.contentHash}\n`);
      expect(markdown).toContain(`Source: ${guide.source.path} (line ${guide.source.line})\n`);
      expect(markdown).toContain(`Source SHA-256: ${guide.source.sha256}\n`);
      expect(markdown).toContain(`Package: ${guide.package} ${guide.packageVersion}\n`);
      expect(markdown).toContain(`Language: ${guide.locale}\n`);
      expect(markdown).toContain(`Canonical URL: ${guide.url}\n`);
      expect(markdown).toContain(`\n\n${guide.description}\n\n${guide.body}\n\n`);
    }
  });

  it('exports only the original sources and audit sections mapped to each guide', () => {
    // Given
    expect(data.sourceAudit.sources.length).toBeGreaterThan(0);

    // When
    const assets = knowledgeAssets();

    // Then
    for (const guide of guides) {
      const markdown = assets.get(
        `knowledge/guides/${guide.package.replace('@owp/', '')}/${guide.path.replace('guide.', '')}.md`,
      );
      const originals = markdown?.split('## Original sources\n\n')[1];
      expect(originals).toBeDefined();
      expect(originals?.match(/^- Source ID: /gm) ?? []).toHaveLength(guide.sources.length);
      for (const source of data.sourceAudit.sources) {
        if (!guide.sources.includes(source.id)) {
          expect(originals).not.toContain(`- Source ID: ${source.id}\n`);
          continue;
        }
        const block = originals
          ?.split(`- Source ID: ${source.id}\n`)[1]
          ?.split('\n- Source ID: ')[0];
        expect(block).toContain(`  - Path: ${source.id}\n`);
        expect(block).toContain(`  - SHA-256: ${source.sha256}\n`);
        const sections = source.sections.filter((section) => section.guideIds.includes(guide.id));
        expect(block?.match(/^  - Section: /gm) ?? []).toHaveLength(sections.length);
        for (const section of sections)
          expect(block).toContain(
            `  - Section: ${section.heading} (line ${section.line}; disposition: ${section.disposition})`,
          );
      }
    }
  });

  it.each([{ sources: [] }, { sources: ['missing/original.md'] }])(
    'omits unavailable audit values when guide sources are $sources',
    ({ sources }) => {
      // Given
      const fixture = {
        ...data,
        records: data.records.map((record) =>
          record.kind === 'guide' ? { ...record, sources } : record,
        ),
        sourceAudit: { ...data.sourceAudit, sources: [] },
      };

      // When
      const assets = knowledgeAssets(fixture);

      // Then
      for (const [path, markdown] of assets) {
        if (!path.endsWith('.md')) continue;
        const metadata = markdown.split('## Original sources\n\n')[1];
        expect(metadata).not.toContain('undefined');
        expect(markdown).toContain('## Original sources\n\n');
        for (const source of sources) {
          expect(markdown).toContain(`- Source ID: ${source}\n`);
          expect(markdown).toContain(`  - Path: ${source}\n`);
        }
        expect(markdown).not.toContain('  - SHA-256:');
        expect(markdown).not.toContain('  - Section:');
      }
    },
  );

  it('preserves the index and JSONL contracts when exporting Markdown metadata', () => {
    // Given
    const expectedIndex = {
      schemaVersion: 1,
      packages: data.packages,
      reviewed: data.reviewed,
      resources: [
        '/api/datagrid.json',
        '/api/charts.json',
        '/api/core.json',
        '/catalogs/datagrid.sources.json',
        '/catalogs/charts.sources.json',
        '/catalogs/core.sources.json',
        '/knowledge/records.jsonl',
        '/knowledge/example-links.json',
      ],
      records: data.records.map(({ id, url, packageVersion, locale, contentHash }) => ({
        id,
        url,
        packageVersion,
        locale,
        contentHash,
      })),
      sourceAudit: data.sourceAudit,
    };

    // When
    const assets = knowledgeAssets();

    // Then
    expect(JSON.parse(assets.get('knowledge/index.json') ?? 'null')).toEqual(expectedIndex);
    const lines = assets.get('knowledge/records.jsonl')?.trim().split('\n') ?? [];
    expect(lines.map((line) => JSON.parse(line))).toEqual(data.records);
  });
});

describe('Charts dependency exports', () => {
  it('includes declared Chart.js plugins in Charts without leaking them into DataGrid', () => {
    // Given
    const pluginNames = ['chartjs-plugin-annotation', 'chartjs-plugin-datalabels'];
    const pluginRecords = pluginNames.map((name) => {
      const record = data.records.find((record) => record.package === name);
      if (!record) throw new TypeError(`Missing plugin fixture: ${name}`);
      return { ...record, id: `${name}:Fixture` };
    });
    const fixture = {
      ...data,
      dependencies: {
        ...data.dependencies,
        'chartjs-plugin-annotation': '3.1.0',
        'chartjs-plugin-datalabels': '2.2.0',
      },
      records: [...data.records, ...pluginRecords],
    };
    expect(pluginRecords).toHaveLength(2);

    // When
    const assets = knowledgeAssets(fixture);

    // Then
    for (const entry of data.packages) {
      const expectedRecords = fixture.records.filter(
        (record) =>
          record.package === entry.name ||
          (entry.id === 'charts' &&
            ['chart.js', 'react-chartjs-2', ...pluginNames].includes(record.package)),
      );
      const payload = JSON.parse(assets.get(`api/${entry.id}.json`) ?? 'null');
      expect(payload).toMatchObject({
        schemaVersion: 1,
        ...entry,
        dependencies: fixture.dependencies,
        records: expectedRecords,
        referenceRecords: [],
      });
      const exampleKeys = new Set(
        expectedRecords.flatMap((record) =>
          record.examples.map(
            (example: { readonly packageId: string; readonly id: string }) =>
              `${example.packageId}/${example.id}`,
          ),
        ),
      );
      expect(payload.examples).toEqual(
        data.examples
          .filter((example) => exampleKeys.has(`${example.packageId}/${example.id}`))
          .map(({ packageId, id, title, source }) => ({ packageId, id, title, source })),
      );
    }
  });
});
