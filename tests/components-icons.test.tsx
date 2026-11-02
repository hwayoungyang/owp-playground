import '../src/app/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import publicApiIndex from 'virtual:public-api/index';
import { ComponentsExample } from '../src/playgrounds/components/examples/icons';
import { readPlaygroundRoute } from '../src/playgrounds/registry';

it('renders exported icon shapes and links every tile to its exact public API record', () => {
  const html = renderToStaticMarkup(<ComponentsExample onData={() => {}} onRecord={() => {}} />);
  const entries =
    publicApiIndex
      .find((entry) => entry.id === 'components')
      ?.entries.filter(
        (entry) => entry.modules.includes('@owp/components/icons') || entry.name === 'OwpSvgIcon',
      ) ?? [];
  const links = Array.from(
    html.matchAll(/class="components-icon-link"[^>]*href="([^"]+)"/g),
    (match) => match[1],
  );
  expect(entries.length).toBeGreaterThan(0);
  expect(links).toHaveLength(entries.length);
  expect(html.match(/<svg\b/g)).toHaveLength(entries.length);
  for (const [index, href] of links.entries()) {
    const route = readPlaygroundRoute(
      new URL(href?.replaceAll('&amp;', '&') ?? '', 'https://example.test').search,
    );
    expect(route).toMatchObject({
      status: 'exports',
      packageId: 'components',
      symbol: entries[index]?.id,
    });
  }
});
