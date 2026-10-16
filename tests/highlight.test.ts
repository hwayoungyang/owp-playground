import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { highlightSource } from '../src/features/code/highlight';
import { gridCatalog } from '../src/playgrounds/datagrid/catalog';

describe('TSX source highlighting', () => {
  it('colors component tags and their props within a JSX return block', () => {
    const source = 'return <div><OwpDataGrid rows={rows} radius={true} height="100%" /></div>;';
    const html = highlightSource(source, 'typescript');
    expect(html).toContain('<span class="hljs-name">OwpDataGrid</span>');
    expect(html).toContain('<span class="hljs-attr">rows</span>');
    expect(html).toContain('<span class="hljs-literal">true</span>');
    expect(html).toContain('<span class="hljs-string">&quot;100%&quot;</span>');
  });
  it('highlights the actual grid tag in every executing sample', async () => {
    for (const example of gridCatalog.filter((entry) => entry.kind === 'grid')) {
      const source = await readFile(
        new URL(`../src/playgrounds/datagrid/${example.source}`, import.meta.url),
        'utf8',
      );
      const html = highlightSource(source, 'typescript');
      expect(html, example.id).toContain('<span class="hljs-name">OwpDataGrid</span>');
    }
  });
});
