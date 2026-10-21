import { expect, it } from 'vitest';
import baseline from '../knowledge/example-code-reviews/baseline.json';
import data from '../src/features/api/data/knowledge.generated.json';
import { knowledgeAssets, reviewedApiCatalog } from '../scripts/knowledge-resources';
import { chartCatalog } from '../src/playgrounds/charts/catalog';
import { gridCatalog } from '../src/playgrounds/datagrid/catalog';
import type { ExampleMetadata } from '../src/shared/types/playground';

it('accounts for every originally unlocated link with a source-backed decision', () => {
  // Given
  const unlocated = baseline.filter((reference) => !reference.located);
  // When / Then
  for (const original of unlocated) {
    const example = data.examples.find(
      (example) => example.packageId === original.packageId && example.id === original.exampleId,
    );
    const decision = example?.referenceReviews.find(
      (entry) => entry.id === original.id && entry.label === original.label,
    );
    expect(decision, `${original.packageId}/${original.exampleId}/${original.label}`).toBeDefined();
    expect(decision?.evidence.length).toBeGreaterThan(0);
  }
});

it('publishes the same reviewed links in API records and the complete retrieval audit', () => {
  // Given
  const assets = knowledgeAssets();
  // When
  const audit = JSON.parse(assets.get('knowledge/example-links.json') ?? 'null');
  // Then
  expect(audit.examples).toEqual(data.examples);
  expect(audit.summary).toEqual(data.exampleLinkAudit);
  for (const example of data.examples)
    for (const reference of example.references) {
      const record = data.records.find((record) => record.id === reference.id);
      const usage = record?.examples.find(
        (usage: { readonly packageId: string; readonly id: string }) =>
          usage.packageId === example.packageId && usage.id === example.id,
      );
      expect(usage).toMatchObject({
        codeUrl: reference.codeUrl,
        location: reference.location,
        codeReview: reference.codeReview,
      });
    }
});

it('uses reviewed API labels in exported catalogs while retaining sample identities and sources', () => {
  const catalogs: readonly {
    readonly packageId: string;
    readonly catalog: readonly ExampleMetadata[];
  }[] = [
    { packageId: 'datagrid', catalog: gridCatalog },
    { packageId: 'charts', catalog: chartCatalog },
  ];
  for (const { packageId, catalog } of catalogs) {
    // Given / When
    const reviewed = reviewedApiCatalog(catalog, packageId);
    // Then
    for (const entry of reviewed) {
      const original = catalog.find((example) => example.id === entry.id);
      const example = data.examples.find(
        (example) => example.packageId === packageId && example.id === entry.id,
      );
      expect(entry.source).toBe(original?.source);
      expect(entry.api).toEqual(example?.references.map((reference) => reference.label));
    }
  }
});

it('retains reasons for implicit usage without publishing invented line highlights', () => {
  // Given
  const remaining = data.examples.flatMap((example) =>
    example.references.filter((reference) => !reference.location),
  );
  // When / Then
  for (const reference of remaining) {
    expect(reference.codeReview).toMatchObject({
      method: 'reviewed',
      reason: expect.stringMatching(/\S/),
    });
    expect(reference.codeUrl).not.toMatch(/[?&](?:file|line|endLine)=/);
  }
});

it('links embedded DataGrid props to DataGrid API with their Charts source locations', () => {
  for (const id of ['sparkline', 'detail-chart']) {
    const example = data.examples.find((entry) => entry.packageId === 'charts' && entry.id === id);
    for (const prop of ['rows', 'columns', 'getRowId', 'visibleRowCount']) {
      const reference = example?.references.find(
        (entry) => entry.id === `@owp/datagrid:OwpDataGridProps.${prop}`,
      );
      expect(reference).toMatchObject({
        packageId: 'datagrid',
        location: { file: `playgrounds/charts/examples/${id}.tsx` },
      });
    }
  }
});

it('keeps starting-guide links limited to the actual starting example', () => {
  const guide = data.examples.find(
    (entry) => entry.packageId === 'datagrid' && entry.id === 'getting-started',
  );
  const ids = guide?.references.map((entry) => entry.id) ?? [];
  expect(ids).toContain('@owp/datagrid:OwpDataGridProps.radius');
  for (const prop of ['saveMode', 'filterModel', 'onCellClick'])
    expect(ids).not.toContain(`@owp/datagrid:OwpDataGridProps.${prop}`);
  for (const reference of guide?.references ?? [])
    expect(reference.location?.file).not.toContain('/runtime/');
});
