import { expect, it } from 'vitest';
import { exampleCodeHref, readCodeLocation } from '../src/features/code/code-location';
import {
  createPlaygroundUrl,
  dataGridPackage,
  getPlaygroundRoute,
  readPlaygroundRoute,
} from '../src/playgrounds/registry';
import { recordsById } from '../src/features/api/model/knowledge';

it('round-trips code links, drops source state on new navigation and preserves other query parameters', () => {
  const location = { file: 'playgrounds/datagrid/examples/renderer.tsx', line: 36, endLine: 36 };
  const route = readPlaygroundRoute(exampleCodeHref('datagrid', 'renderer', location));
  expect(route).toMatchObject({ status: 'ready', tab: 'code', codeTarget: location });
  const url = createPlaygroundUrl('https://example.test/?ref=docs', route);
  expect(readPlaygroundRoute(url.search)).toEqual(route);
  expect(url.searchParams.get('ref')).toBe('docs');
  const next = createPlaygroundUrl(url.href, getPlaygroundRoute(dataGridPackage, 'overview'));
  for (const key of ['tab', 'file', 'line', 'endLine'])
    expect(next.searchParams.has(key)).toBe(false);
  const api = createPlaygroundUrl(url.href, readPlaygroundRoute('?package=datagrid&view=api'));
  expect(api.searchParams.has('file')).toBe(false);
});
it.each([
  'file=../../secret.ts&line=1',
  'file=playgrounds/charts/examples/line.tsx&line=1',
  'file=playgrounds/datagrid/examples/a.tsx&line=-1',
  'file=playgrounds/datagrid/examples/a.tsx&line=NaN',
  'file=playgrounds/datagrid/examples/a.tsx&line=10&endLine=2',
  'file=playgrounds/datagrid/examples/a.tsx&line=1&endLine=10000',
])('rejects malformed or unrelated source targets: %s', (query) => {
  expect(readCodeLocation(new URLSearchParams(query), 'datagrid')).toBeUndefined();
});
it('connects the API screenshots examples to executable call sites', () => {
  const examples = recordsById.get('@owp/datagrid:OwpDataGridApi.setCellValue')?.examples ?? [];
  for (const id of ['renderer', 'ref-focus']) {
    const example = examples.find((entry) => entry.id === id);
    expect(example?.location?.file).toBe(`playgrounds/datagrid/examples/${id}.tsx`);
    expect(readPlaygroundRoute(example?.codeUrl ?? '')).toMatchObject({
      tab: 'code',
      codeTarget: { file: `playgrounds/datagrid/examples/${id}.tsx` },
    });
  }
});
