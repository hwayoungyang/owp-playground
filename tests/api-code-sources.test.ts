import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import data from '../src/features/api/data/knowledge.generated.json';

it('publishes exact source hashes and bounded line ranges for every located API usage', async () => {
  const contents = new Map<string, string>();
  for (const example of data.examples)
    for (const reference of example.references) {
      const location = reference.location;
      if (!location) continue;
      expect(location.file.startsWith(`playgrounds/${example.packageId}/`)).toBe(true);
      let content = contents.get(location.file);
      if (content === undefined) {
        content = await readFile(new URL(`../src/${location.file}`, import.meta.url), 'utf8');
        contents.set(location.file, content);
      }
      expect(location.sha256).toBe(createHash('sha256').update(content).digest('hex'));
      const lines = content.split('\n');
      expect(location.line).toBeGreaterThan(0);
      expect(location.endLine).toBeLessThanOrEqual(lines.length);
      expect(
        lines
          .slice(location.line - 1, location.endLine)
          .join('\n')
          .trim(),
      ).not.toBe('');
    }
});

it.each([
  [
    'programmatic-events',
    'tooltip.setActiveElements',
    'examples/programmatic-events.tsx',
    'instance.tooltip?.setActiveElements(',
  ],
  ['time-series', 'zoomSlider.x', 'examples/time-series.tsx', 'zoomSlider={{ x: true }}'],
  ['bubble', 'data.datasets.data', 'examples/bubble.tsx', 'data: Array.from('],
  [
    'legend-events',
    'legend.onClick',
    'runtime/ChartCanvas.tsx',
    "onClick: (item) => onRecord?.('legend-click'",
  ],
])('connects %s %s to its own API usage', async (id, label, file, code) => {
  const reference = data.examples
    .find((entry) => entry.packageId === 'charts' && entry.id === id)
    ?.references.find((entry) => entry.label === label);
  expect(reference?.location?.file).toBe(`playgrounds/charts/${file}`);
  const location = reference?.location;
  expect(location).toBeTruthy();
  if (!location) return;
  const content = await readFile(new URL(`../src/${location.file}`, import.meta.url), 'utf8');
  expect(
    content
      .split('\n')
      .slice(location.line - 1, location.endLine)
      .join('\n'),
  ).toContain(code);
});

it('uses typed column settings and excludes unrelated DOM style from API examples', () => {
  const locate = (packageId: string, id: string, label: string) =>
    data.examples
      .find((entry) => entry.packageId === packageId && entry.id === id)
      ?.references.find((entry) => entry.label === label)?.location;
  expect(locate('datagrid', 'select', 'type')).toMatchObject({
    file: 'playgrounds/datagrid/examples/configs/selectEditors.tsx',
    line: 22,
  });
  expect(locate('datagrid', 'custom-style', 'style')).toBeUndefined();
});

it('connects reviewed forwarding paths to executable values instead of utility inputs or type signatures', async () => {
  // Given
  const topN = data.examples
    .find((example) => example.id === 'top-n' && example.packageId === 'charts')
    ?.references.find((reference) => reference.label === 'data');
  // When
  const content = await readFile(
    new URL(`../src/${topN?.location?.file}`, import.meta.url),
    'utf8',
  );
  // Then
  expect(topN?.codeReview).toMatchObject({ method: 'reviewed', mode: 'forwarded' });
  expect(
    content
      .split('\n')
      .slice((topN?.location?.line ?? 0) - 1, topN?.location?.endLine)
      .join('\n'),
  ).toContain('    data,');
  for (const id of ['grouped-bar', 'multi-line', 'oee']) {
    const reference = data.examples
      .find((example) => example.id === id)
      ?.references.find((reference) => reference.label === 'series');
    expect(reference?.location?.file).toBe(`playgrounds/charts/examples/${id}.tsx`);
    expect(reference?.codeReview).toMatchObject({ method: 'reviewed', mode: 'forwarded' });
  }
});
