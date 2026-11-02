import '../src/app/i18n';
import { i18next } from '@owp/core/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it } from 'vitest';
import { buildNavigationModel } from '../src/app/layout/navigation';
import { ApiLinks } from '../src/features/api/ApiLinks';
import { componentsCatalog, componentsCategories } from '../src/playgrounds/components/catalog';
import { componentsPackage, completedPlaygroundPackages } from '../src/playgrounds/packages';
import {
  createPlaygroundUrl,
  getPlaygroundRoute,
  readPlaygroundRoute,
} from '../src/playgrounds/registry';

afterEach(async () => {
  await i18next.changeLanguage('ko');
});

it('keeps API navigation independent of completed Knowledge package registration', () => {
  const model = buildNavigationModel({
    playground: componentsPackage,
    examples: componentsCatalog,
    categories: componentsCategories,
    currentId: 'api',
    isApi: true,
    getExampleUrl: (id) =>
      createPlaygroundUrl(
        'https://playground.example/?lang=en',
        getPlaygroundRoute(componentsPackage, id),
      ).href,
  });
  const docs = model.groups.find((group) => group.type === 'docs');
  const api = docs?.items.find((item) => item.id === 'api');
  expect(api?.active).toBe(true);
  const url = new URL(api?.url ?? 'https://playground.example/');
  expect(url.searchParams.get('lang')).toBe('en');
  expect(readPlaygroundRoute(url.search)).toMatchObject({ status: 'api', symbol: null });
  expect(model.exampleCount).toBe(56);
  expect(componentsPackage.status).toBe('available');
  expect(completedPlaygroundPackages.some((entry) => String(entry.id) === 'components')).toBe(
    false,
  );
});

it('links every API on grouped examples to its own detail while preserving language', async () => {
  const example = componentsCatalog.find((entry) => entry.id === 'field-helper-text');
  if (!example) throw new RangeError('Missing grouped helper example');
  for (const language of ['ko', 'en']) {
    await i18next.changeLanguage(language);
    const html = renderToStaticMarkup(<ApiLinks example={example} />);
    const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g), (match) => match[1]);
    expect(hrefs).toHaveLength(2);
    for (const [index, href] of hrefs.entries()) {
      const route = readPlaygroundRoute(
        new URL(href?.replaceAll('&amp;', '&') ?? '', 'https://playground.example/').search,
      );
      expect(route).toMatchObject({
        status: 'api',
        symbol: `@owp/components:${example.api[index]}`,
      });
      expect(href).toContain(`lang=${language}`);
    }
  }
});
