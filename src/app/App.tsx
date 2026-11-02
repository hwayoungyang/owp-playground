import { ThemeStudio } from './workspaces';
import publicApiIndex from 'virtual:public-api/index';
import { publicApiSampleId } from '../features/public-api/types';
import { WorkspaceRouter } from './WorkspaceRouter';
import { useOwpTranslation } from '@owp/components/hooks';
import { Drawer } from '@mui/material';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  defaultPreviewTheme,
  type PreviewThemeSettings,
} from '../features/theme-studio/model/preview';
import { supportsThemeStudio } from '../features/theme-studio/model/studio';
import { chartCatalog, chartCategories } from '../playgrounds/charts/catalog';
import { coreCatalog, coreCategories } from '../playgrounds/core/catalog';
import { componentsCatalog, componentsCategories } from '../playgrounds/components/catalog';
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
import { PackageSidebar } from './layout/PackageNotice';
import { Sidebar } from './layout/Sidebar';
import { Provider } from './providers/Provider';

const emptyNavigation = [] as const;

export function App() {
  const { t, i18n } = useOwpTranslation();
  const [route, setRoute] = useState(() => readPlaygroundRoute(location.search));
  const [mode, setMode] = useState<ColorMode>(() =>
    new URLSearchParams(location.search).get('colorMode') === 'dark' ? 'dark' : 'light',
  );
  useEffect(() => {
    const syncLanguage = (language: string) => {
      const url = new URL(location.href);
      url.searchParams.set('lang', language === 'en' ? 'en' : 'ko');
      history.replaceState(null, '', url);
    };
    i18n.on('languageChanged', syncLanguage);
    return () => {
      i18n.off('languageChanged', syncLanguage);
    };
  }, [i18n]);
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
  const examples =
    route.playground.id === 'components'
      ? componentsCatalog
      : route.playground.id === 'core'
        ? coreCatalog
        : route.playground.id === 'charts'
          ? chartCatalog
          : route.playground.id === 'datagrid'
            ? gridCatalog
            : emptyNavigation;
  const categories =
    route.playground.id === 'components'
      ? componentsCategories
      : route.playground.id === 'core'
        ? coreCategories
        : route.playground.id === 'charts'
          ? chartCategories
          : route.playground.id === 'datagrid'
            ? gridCategories
            : emptyNavigation;
  const publicEntry =
    (route.status === 'api' || route.status === 'exports') && route.symbol
      ? publicApiIndex
          .find((entry) => entry.id === route.playground.id)
          ?.entries.find((entry) => entry.id === route.symbol)
      : undefined;
  const currentNavigationId = publicEntry
    ? publicApiSampleId(publicEntry.id)
    : (route.example?.id ?? '');
  const effectiveExample =
    route.status === 'charts' && route.example.kind === 'chart'
      ? selectedChartExample(route.example, route.initialPreset)
      : publicEntry && route.example
        ? { ...route.example, title: publicEntry.label ?? publicEntry.name }
        : route.example;

  const navigationModel = useMemo(
    () =>
      buildNavigationModel({
        playground: route.playground,
        examples,
        categories,
        currentId: currentNavigationId,
        isApi: route.status === 'api',
        publicEntries: publicApiIndex.find((entry) => entry.id === route.playground.id)?.entries,
        getExampleUrl: (id: string) => {
          const url = createPlaygroundUrl(location.href, getPlaygroundRoute(route.playground, id));
          url.searchParams.set('lang', i18n.language === 'en' ? 'en' : 'ko');
          return url.href;
        },
      }),
    [route.playground, examples, categories, currentNavigationId, route.status, i18n.language],
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
                {!route.example && <div className="package-note">{route.playground.title}</div>}
              </div>
            )}
            <Suspense
              fallback={
                <div className="workspace-loading" role="status">
                  {t('예제를 불러오는 중…')}
                </div>
              }
            >
              <WorkspaceRouter
                route={route}
                theme={previewTheme}
                onThemeChange={setPreviewTheme}
                onThemeOpen={() => setThemeOpen(true)}
                onNavigateExample={navigateExample}
                onDataGrid={() => navigatePackage(dataGridPackage)}
              />
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
