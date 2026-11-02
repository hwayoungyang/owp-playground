import '../src/app/i18n';
import { i18next } from '@owp/core/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { PackageGettingStarted } from '../src/playgrounds/PackageGettingStarted';
import {
  hasStandaloneGuide,
  packageGuideEntry,
  packageIntroductions,
} from '../src/playgrounds/introductions';
import { packageCatalog } from '../src/playgrounds/packages';
import {
  createPlaygroundUrl,
  getPlaygroundRoute,
  readPlaygroundRoute,
} from '../src/playgrounds/registry';
import { buildNavigationModel } from '../src/app/layout/navigation';

vi.mock('../src/features/code/HighlightedCode', () => ({
  HighlightedCode: ({ html }: { readonly html: string }) => <code>{html}</code>,
}));
afterEach(async () => {
  await i18next.changeLanguage('ko');
});

it('preserves package, language and explicit API destinations when adding setup guides', () => {
  for (const playground of packageCatalog.filter((entry) => hasStandaloneGuide(entry.id))) {
    const route = getPlaygroundRoute(playground);
    expect(route.status).toBe('package-guide');
    const url = createPlaygroundUrl('https://example.test/?lang=en#main-content', route);
    expect(readPlaygroundRoute(url.search)).toEqual(route);
    expect(url.searchParams.get('lang')).toBe('en');
    expect(getPlaygroundRoute(playground, 'exports').status).toBe('exports');
    expect(readPlaygroundRoute(`?package=${playground.id}&view=api`).status).toBe('api');
    const model = buildNavigationModel({
      playground,
      examples: [packageGuideEntry(playground)],
      categories: [],
      currentId: 'getting-started',
      isApi: false,
      getExampleUrl: (id) => id,
    });
    const docs = model.groups.find((group) => group.type === 'docs');
    expect(docs?.items.map((item) => ({ id: item.id, active: item.active }))).toEqual([
      { id: 'getting-started', active: true },
      { id: 'api', active: false },
    ]);
  }
});

it.each(['ko', 'en'])(
  'renders every new guide with the installed version and working API link in %s',
  async (language) => {
    await i18next.changeLanguage(language);
    for (const playground of packageCatalog.filter((entry) => hasStandaloneGuide(entry.id))) {
      const html = renderToStaticMarkup(<PackageGettingStarted playground={playground} />);
      expect(html).toContain(`pnpm add ${playground.name}@${playground.version}`);
      expect(html).toContain(`${playground.id}-mcp`);
      expect(html).toContain('list_packages');
      expect(html).toContain(`${playground.name} ${playground.version}`);
      expect(html).toContain(`package=${playground.id}&amp;sample=exports&amp;lang=${language}`);
      expect(html).not.toContain('{{packageName}}');
      if (language === 'en' && hasStandaloneGuide(playground.id))
        expect(html).not.toContain(packageIntroductions[playground.id]);
    }
  },
);
