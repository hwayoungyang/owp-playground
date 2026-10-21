import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { createExampleCodeReviews } from '../scripts/api-example-reviews.mjs';

const file = 'playgrounds/charts/examples/example.tsx';
const content = 'const chart = { data: makeData() };\nreturn <ChartFrame {...chart} />;';
const sha256 = createHash('sha256').update(content).digest('hex');
const apiId = '@owp/charts:ChartFrameProps.data';
const example = {
  id: 'example',
  packageId: 'charts',
  references: [{ id: apiId, label: 'data', packageId: 'charts' }],
};
const files = [{ file: `/src/${file}`, content, sha256, priority: 100 }];
const records = new Map([[apiId, { id: apiId, package: '@owp/charts' }]]);
const review = {
  exampleId: 'example',
  apiId,
  label: 'data',
  action: 'locate',
  mode: 'forwarded',
  file,
  snippet: 'data: makeData()',
  reason: 'ChartFrame에 전달하는 data',
  evidence: [{ file, snippet: 'return <ChartFrame {...chart} />;' }],
};

it('derives highlighted lines and proof hashes from reviewed source instead of stored line numbers', () => {
  // Given
  const reviewer = createExampleCodeReviews({ charts: [review] }, { [file]: sha256 });
  // When
  const result = reviewer.resolve({ example, files, records });
  // Then
  expect(result.references[0].location).toEqual({ file, line: 1, endLine: 1, sha256 });
  expect(result.references[0].codeReview.evidence).toEqual([{ file, line: 2, endLine: 2, sha256 }]);
  expect(() => reviewer.assertComplete()).not.toThrow();
});

it.each([
  { name: 'missing excerpt', changes: { snippet: 'data: unknown()' } },
  { name: 'unreachable source', changes: { file: 'playgrounds/charts/examples/other.tsx' } },
  { name: 'another package', changes: { file: 'playgrounds/datagrid/examples/example.tsx' } },
  { name: 'changed API owner', changes: { apiId: '@owp/charts:CreateChartDataParams.data' } },
  {
    name: 'missing replacement API',
    changes: { action: 'replace', replacement: { id: 'missing:API', label: 'data' } },
  },
])('rejects $name instead of publishing a plausible highlight', ({ changes }) => {
  // Given
  const reviewer = createExampleCodeReviews(
    { charts: [{ ...review, ...changes }] },
    { [file]: sha256 },
  );
  // When / Then
  expect(() => reviewer.resolve({ example, files, records })).toThrow();
});

it('requires a new review when the source changes even if the excerpt still exists', () => {
  // Given
  const reviewer = createExampleCodeReviews({ charts: [review] }, { [file]: sha256 });
  const modified = `${content}\nchart.data = otherData;`;
  const changedFiles = [
    { ...files[0], content: modified, sha256: createHash('sha256').update(modified).digest('hex') },
  ];
  // When / Then
  expect(() => reviewer.resolve({ example, files: changedFiles, records })).toThrow();
});

it('rejects duplicated source excerpts instead of arbitrarily choosing the first occurrence', () => {
  // Given
  const duplicated = `${content}\nconst second = { data: makeData() };`;
  const duplicatedHash = createHash('sha256').update(duplicated).digest('hex');
  const reviewer = createExampleCodeReviews({ charts: [review] }, { [file]: duplicatedHash });
  // When / Then
  expect(() =>
    reviewer.resolve({
      example,
      files: [{ ...files[0], content: duplicated, sha256: duplicatedHash }],
      records,
    }),
  ).toThrow();
});

it('keeps rejected associations in review metadata while removing them from executable API references', () => {
  // Given
  const { mode: _mode, file: _file, snippet: _snippet, ...identity } = review;
  const reviewer = createExampleCodeReviews(
    { charts: [{ ...identity, action: 'remove' }] },
    { [file]: sha256 },
  );
  // When
  const result = reviewer.resolve({ example, files, records });
  // Then
  expect(result.references).toEqual([]);
  expect(result.referenceReviews[0]).toMatchObject({ id: apiId, label: 'data', action: 'remove' });
});

it('changes the API owner and target label together when review identifies a different contract', () => {
  // Given
  const replacement = { id: '@owp/charts:CoreChartProps.data', label: 'CoreChart.data' };
  const reviewer = createExampleCodeReviews(
    { charts: [{ ...review, action: 'replace', replacement }] },
    { [file]: sha256 },
  );
  const targets = new Map([
    ...records,
    [replacement.id, { ...records.get(apiId), id: replacement.id }],
  ]);
  // When
  const result = reviewer.resolve({ example, files, records: targets });
  // Then
  expect(result.references[0]).toMatchObject({
    ...replacement,
    location: { file, line: 1 },
    codeReview: { mode: 'forwarded' },
  });
  expect(result.referenceReviews[0].target).toEqual(replacement);
});

it('rejects obsolete decisions after an example or label is renamed', () => {
  // Given
  const reviewer = createExampleCodeReviews({ charts: [review] }, { [file]: sha256 });
  // When / Then
  expect(() => reviewer.assertComplete()).toThrow();
});
