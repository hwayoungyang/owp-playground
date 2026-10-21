import {
  ApiReference,
  ChartsGettingStarted,
  ChartsWorkspace,
  GridGettingStarted,
  GridWorkspace,
  GuideCodeWorkspace,
  ThemeStudio,
} from './workspaces';
import { useOwpTranslation } from '@owp/components/hooks';
import { Drawer } from '@mui/material';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  defaultPreviewTheme,
  type PreviewThemeSettings,
} from '../features/theme-studio/model/preview';
import { supportsThemeStudio } from '../features/theme-studio/model/studio';
import { chartCatalog, chartCategories } from '../playgrounds/charts/catalog';
import { selectedChartExample } from '../playgrounds/charts/model/variants';
import {
  gridAliases,
  gridCatalog,
  categories as gridCategories,
} from '../playgrounds/datagrid/catalog';
import {
  createPlaygroundUrl,
  dataGridPackage,
  getPlaygroundRoute,
  type PlaygroundPackage,
  type PlaygroundRoute,
  readPlaygroundRoute,
} from '../playgrounds/registry';
import type { ColorMode } from '../shared/theme/tokens';
import { PlaygroundNavigation } from '../shared/ui/PlaygroundLink';
import { Header } from './layout/Header';
import { buildNavigationModel } from './layout/navigation';
import { PackageNotice, PackageSidebar } from './layout/PackageNotice';
import { Sidebar } from './layout/Sidebar';
import { Provider } from './providers/Provider';

export function App() {
  const { t, i18n } = useOwpTranslation();
  const [route, setRoute] = useState(() => readPlaygroundRoute(location.search));
  const [mode, setMode] = useState<ColorMode>('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [packageThemes, setPackageThemes] = useState({
    datagrid: defaultPreviewTheme,
    components: defaultPreviewTheme,
  });
  const themeTarget = route.playground.id === 'components' ? 'components' : 'datagrid';
  const previewTheme = packageThemes[themeTarget];
  const setPreviewTheme = (next: PreviewThemeSettings) =>
    setPackageThemes((previous) => ({ ...previous, [themeTarget]: next }));
  const [themeOpen, setThemeOpen] = useState(false);
  const desktopSearch = useRef<HTMLInputElement>(null);
  const mobileSearch = useRef<HTMLInputElement>(null);
  const navigate = (next: PlaygroundRoute) => {
    const url = createPlaygroundUrl(location.href, next);
    if (url.href !== location.href) history.pushState(null, '', url);
    setRoute(next);
    setMenuOpen(false);
    setThemeOpen(false);
  };
  const navigateExample = (id: string) => navigate(getPlaygroundRoute(route.playground, id));
  const examples = route.playground.id === 'charts' ? chartCatalog : gridCatalog;
  const categories = route.playground.id === 'charts' ? chartCategories : gridCategories;
  const effectiveExample =
    route.status === 'charts' && route.example.kind === 'chart'
      ? selectedChartExample(route.example, route.initialPreset)
      : route.example;

  const navigationModel = useMemo(
    () =>
      buildNavigationModel({
        playground: route.playground,
        examples,
        categories,
        currentId: route.example?.id ?? '',
        isApi: route.status === 'api',
        getExampleUrl: (id: string) =>
          createPlaygroundUrl(location.href, getPlaygroundRoute(route.playground, id)).href,
      }),
    [route.playground, examples, categories, route.example?.id, route.status],
  );

  const navigatePackage = (next: PlaygroundPackage) => {
    if (next.id !== route.playground.id) navigate(getPlaygroundRoute(next));
  };
  const navigation = route.example ? (
    <Sidebar
      model={navigationModel}
      playground={route.playground}
      onNavigate={navigateExample}
      searchRef={desktopSearch}
    />
  ) : (
    <PackageSidebar playground={route.playground} />
  );
  useEffect(() => {
    const normalizeUrl = (next: PlaygroundRoute) => {
      const url = createPlaygroundUrl(location.href, next);
      const exampleId = new URLSearchParams(location.search).get('sample');
      if (exampleId && next.status === 'ready' && gridAliases[exampleId] === next.example.id) {
        url.searchParams.set('sample', exampleId);
      }
      if (url.href !== location.href) history.replaceState(null, '', url);
    };
    normalizeUrl(readPlaygroundRoute(location.search));
    const onPop = () => {
      const next = readPlaygroundRoute(location.search);
      normalizeUrl(next);
      setRoute(next);
      setMenuOpen(false);
      setThemeOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (window.matchMedia('(min-width: 900px)').matches) desktopSearch.current?.focus();
        else setMenuOpen(true);
      }
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  useEffect(() => {
    document.title = `${t(effectiveExample?.title ?? route.playground.title)} — OWP Playground`;
    document.documentElement.lang = i18n.language;
  }, [effectiveExample?.title, route.playground.title, t, i18n.language]);
  return (
    <Provider mode={mode}>
      <PlaygroundNavigation
        onNavigate={(href) => navigate(readPlaygroundRoute(new URL(href, location.href).search))}
      >
        <a className="skip-link" href="#main-content">
          {t('본문으로 이동')}
        </a>
        <div className="app-shell">
          <Header
            playground={route.playground}
            example={effectiveExample}
            categoryLabel={navigationModel.currentCategoryLabel}
            onPackageChange={navigatePackage}
            mode={mode}
            onModeChange={() => setMode((previous) => (previous === 'light' ? 'dark' : 'light'))}
            onMenuOpen={() => setMenuOpen(true)}
            onThemeOpen={
              supportsThemeStudio(route.playground) ? () => setThemeOpen(true) : undefined
            }
          />
          <aside className="desktop-sidebar">{navigation}</aside>
          <Drawer
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            slotProps={{ transition: { onEntered: () => mobileSearch.current?.focus() } }}
          >
            {route.example ? (
              <Sidebar
                model={navigationModel}
                playground={route.playground}
                onNavigate={navigateExample}
                searchRef={mobileSearch}
              />
            ) : (
              <PackageSidebar playground={route.playground} />
            )}
          </Drawer>
          <main id="main-content" className="main-content" tabIndex={-1}>
            {!route.example && (
              <div className="package-heading">
                <div>
                  <h1>
                    {route.playground.title}
                    {route.playground.version && (
                      <span className="package-version">v{route.playground.version}</span>
                    )}
                  </h1>
                  {!route.example && <p>{t('예제를 추가하고 있습니다.')}</p>}
                </div>
                {!route.example && <div className="package-note">{route.playground.name}</div>}
              </div>
            )}
            <Suspense
              fallback={
                <div className="workspace-loading" role="status">
                  {t('예제를 불러오는 중…')}
                </div>
              }
            >
              {route.status === 'api' ? (
                <ApiReference
                  key={route.playground.id}
                  packageId={route.playground.id}
                  symbol={route.symbol}
                />
              ) : (route.status === 'ready' || route.status === 'charts') &&
                route.example.kind === 'guide' &&
                route.tab === 'code' ? (
                <GuideCodeWorkspace
                  key={`${route.playground.id}-${route.example.id}`}
                  example={route.example}
                  codeTarget={route.codeTarget}
                />
              ) : route.status === 'charts' ? (
                route.example.kind === 'guide' ? (
                  <ChartsGettingStarted
                    key={`charts-${route.example.id}`}
                    example={route.example}
                  />
                ) : (
                  <ChartsWorkspace
                    key={`charts-${effectiveExample?.id}`}
                    example={selectedChartExample(route.example, route.initialPreset)}
                    canonicalId={route.example.id}
                    onSelectVariant={(id) => {
                      if (id !== effectiveExample?.id) navigateExample(id);
                    }}
                    initialTab={route.tab}
                    codeTarget={route.codeTarget}
                  />
                )
              ) : route.example ? (
                route.example.kind === 'guide' ? (
                  <GridGettingStarted key={route.example.id} example={route.example} />
                ) : (
                  <GridWorkspace
                    key={route.example.id}
                    example={route.example}
                    initialTab={route.tab}
                    codeTarget={route.codeTarget}
                    theme={previewTheme}
                    onThemeChange={setPreviewTheme}
                    onThemeOpen={() => setThemeOpen(true)}
                  />
                )
              ) : (
                <PackageNotice onDataGrid={() => navigatePackage(dataGridPackage)} />
              )}
            </Suspense>
          </main>
        </div>
        {themeOpen && supportsThemeStudio(route.playground) && (
          <Suspense fallback={null}>
            <ThemeStudio
              open={themeOpen}
              onClose={() => setThemeOpen(false)}
              target={route.playground.id === 'components' ? 'components' : 'datagrid'}
              value={previewTheme}
              onChange={setPreviewTheme}
            />
          </Suspense>
        )}
      </PlaygroundNavigation>
    </Provider>
  );
}
