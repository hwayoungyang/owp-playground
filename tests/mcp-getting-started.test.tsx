import { renderToStaticMarkup } from 'react-dom/server';
import i18next from 'i18next';
import { expect, it, vi } from 'vitest';
import '../src/app/i18n';
import { McpGettingStarted } from '../src/features/mcp/McpGettingStarted';
import { coreCatalog } from '../src/playgrounds/core/catalog';
import { CoreGettingStarted } from '../src/playgrounds/core/guides/GettingStarted';
import { corePackage } from '../src/playgrounds/packages';

vi.mock('../src/features/code/HighlightedCode', () => ({
  HighlightedCode: ({ html }: { readonly html: string }) => <code>{html}</code>,
}));

it('connects both Core outlines to the MCP heading before package setup', () => {
  const example = coreCatalog.find((entry) => entry.id === 'getting-started');
  if (!example || example.kind !== 'guide') throw new TypeError('Missing Core setup guide');

  const html = renderToStaticMarkup(<CoreGettingStarted example={example} />);

  expect(html.match(/href="#core-mcp"/g)).toHaveLength(2);
  expect(html.match(/<h2 id="core-mcp">/g)).toHaveLength(1);
  expect(html).toContain('<section aria-labelledby="core-mcp">');
  expect(html.indexOf('<h2 id="core-mcp">')).toBeLessThan(html.indexOf('<h2 id="core-registry">'));
  const mcpSection = html.slice(
    html.indexOf('<section aria-labelledby="core-mcp">'),
    html.indexOf('<section aria-labelledby="core-registry">'),
  );
  expect(mcpSection).toContain(`${corePackage.name} ${corePackage.version}`);
});

it('keeps generated MCP heading associations unique when no anchor is provided', () => {
  const html = renderToStaticMarkup(
    <>
      <McpGettingStarted packageName="@owp/charts" version="5.0.3" />
      <McpGettingStarted packageName="@owp/datagrid" version="3.5.2" />
    </>,
  );
  const headingIds = [...html.matchAll(/<h2 id="([^"]+)">/g)].map((match) => match[1]);

  expect(headingIds).toHaveLength(2);
  expect(new Set(headingIds).size).toBe(2);
  for (const headingId of headingIds) expect(html).toContain(`aria-labelledby="${headingId}"`);
});

it.each(['ko', 'en'])(
  'interpolates the selected package version in the %s request',
  async (lang) => {
    await i18next.changeLanguage(lang);
    try {
      const html = renderToStaticMarkup(
        <McpGettingStarted packageName="@owp/core" version="9.0.0" />,
      );

      expect(html).toContain('@owp/core 9.0.0');
      expect(html).not.toContain('{{packageName}}');
      expect(html).not.toContain('{{version}}');
    } finally {
      await i18next.changeLanguage('ko');
    }
  },
);
