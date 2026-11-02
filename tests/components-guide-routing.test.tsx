import '../src/app/i18n';
import { i18next } from '@owp/core/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceRouter } from '../src/app/WorkspaceRouter';
import { GuideCodeWorkspace } from '../src/features/code/GuideCodeWorkspace';
import { defaultPreviewTheme } from '../src/features/theme-studio/model/preview';
import { readPlaygroundRoute } from '../src/playgrounds/registry';
import type { ExampleMetadata } from '../src/shared/types/playground';

vi.mock('../src/app/workspaces', () => ({
  PublicApiWorkspace: ({
    packageId,
    symbol,
  }: {
    readonly packageId: string;
    readonly symbol: string | null;
  }) => (
    <div>
      {packageId}-api:{symbol ?? 'index'}
    </div>
  ),
  ComponentsApiReference: ({ symbol }: { readonly symbol: string | null }) => (
    <div>components-api:{symbol ?? 'index'}</div>
  ),
  ApiReference: ({ packageId }: { readonly packageId: string }) => <div>{packageId}-api</div>,
  ComponentsGettingStarted: () => <div>components-guide</div>,
  ComponentsWorkspace: () => <div>components-example</div>,
  GuideCodeWorkspace: () => <div>guide-code</div>,
}));
vi.mock('../src/features/code/CodeViewer', () => ({
  CodeViewer: ({ example }: { readonly example: ExampleMetadata }) => <pre>{example.source}</pre>,
}));

afterEach(async () => {
  await i18next.changeLanguage('ko');
});

describe('Components guide workspace routing', () => {
  it('renders the guide, shared guide code, and executable page through their own workspaces', () => {
    for (const [search, marker] of [
      ['?package=components', 'components-guide'],
      ['?package=components&sample=getting-started&tab=code', 'guide-code'],
      ['?package=components&sample=number-field', 'components-example'],
    ] as const) {
      const html = renderToStaticMarkup(
        <WorkspaceRouter
          route={readPlaygroundRoute(search)}
          theme={defaultPreviewTheme}
          onThemeChange={() => {}}
          onThemeOpen={() => {}}
          onNavigateExample={() => {}}
          onDataGrid={() => {}}
        />,
      );
      expect(html).toContain(marker);
    }
  });

  it('labels Components guide code correctly and preserves the language in its return link', async () => {
    const route = readPlaygroundRoute('?package=components&sample=getting-started&tab=code');
    if (route.status !== 'components') throw new RangeError('Expected Components guide route');
    for (const language of ['ko', 'en']) {
      await i18next.changeLanguage(language);
      const html = renderToStaticMarkup(<GuideCodeWorkspace example={route.example} />);
      expect(html).toContain('owp/components');
      expect(html).toContain('guides/getting-started.tsx');
      expect(html).toContain(`sample=getting-started&amp;lang=${language}`);
      expect(html).not.toContain('OwpCharts');
    }
  });

  it('uses one public API workspace and retains nested type documentation', () => {
    for (const [search, marker] of [
      ['?package=components&view=api', 'components-api:index'],
      [
        '?package=components&view=api&symbol=%40owp%2Fcomponents%3AOwpNumberField',
        'components-api:@owp/components:OwpNumberField',
      ],
      ['?package=core&view=api', 'core-api:index'],
      ['?package=datagrid&view=api', 'datagrid-api:index'],
      ['?package=charts&view=api', 'charts-api:index'],
      [
        '?package=datagrid&view=api&symbol=%40owp%2Fdatagrid%3AOwpDataGridProps.rows',
        'datagrid-api',
      ],
    ] as const) {
      const html = renderToStaticMarkup(
        <WorkspaceRouter
          route={readPlaygroundRoute(search)}
          theme={defaultPreviewTheme}
          onThemeChange={() => {}}
          onThemeOpen={() => {}}
          onNavigateExample={() => {}}
          onDataGrid={() => {}}
        />,
      );
      expect(html).toContain(marker);
    }
  });
});
