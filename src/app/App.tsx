import { useOwpTranslation } from '@owp/components/hooks';
import { Drawer } from '@mui/material';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  defaultPreviewTheme,
  type PreviewThemeSettings,
} from '../features/theme-studio/model/preview';
import { supportsThemeStudio } from '../features/theme-studio/model/studio';
import { chartCatalog, chartCategories } from '../playgrounds/charts/catalog';
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
import { Header } from './layout/Header';
import { PackageNotice, PackageSidebar } from './layout/PackageNotice';
import { Sidebar } from './layout/Sidebar';
import { Provider } from './providers/Provider';

const GridWorkspace = lazy(() =>
  import('../playgrounds/datagrid/runtime/GridWorkspace').then((module) => ({
    default: module.GridWorkspace,
  })),
);

const GridGettingStarted = lazy(() =>
  import('../playgrounds/datagrid/guides/GridGettingStarted').then((module) => ({
    default: module.GridGettingStarted,
  })),
);
const ThemeStudio = lazy(() =>
  import('../features/theme-studio/ThemeStudio').then((module) => ({
    default: module.ThemeStudio,
  })),
);

const ChartsWorkspace = lazy(() =>
  import('../playgrounds/charts/runtime/Workspace').then((module) => ({
    default: module.ChartsWorkspace,
  })),
);
const ChartsGettingStarted = lazy(() =>
  import('../playgrounds/charts/guides/GettingStarted').then((module) => ({
    default: module.ChartsGettingStarted,
  })),
);

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
  const examples = route.status === 'charts' ? chartCatalog : gridCatalog;
  const categories = route.status === 'charts' ? chartCategories : gridCategories;
  const sidebarProps = {
    playground: route.playground,
    examples,
    categories,
    exampleCount: examples.filter((entry) => entry.kind !== 'guide').length,
    getExampleUrl: (id: string) =>
      createPlaygroundUrl(location.href, getPlaygroundRoute(route.playground, id)).href,
  };
  const navigatePackage = (next: PlaygroundPackage) => {
    if (next.id !== route.playground.id) navigate(getPlaygroundRoute(next));
  };
  const navigation = route.example ? (
    <Sidebar
      {...sidebarProps}
      example={route.example}
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
    document.title = `${t(route.example?.title ?? route.playground.title)} — OWP Playground`;
    document.documentElement.lang = i18n.language;
  }, [route, t, i18n.language]);
  return (
    <Provider mode={mode}>
      <a className="skip-link" href="#main-content">
        {t('본문으로 이동')}
      </a>
      <div className="app-shell">
        <Header
          playground={route.playground}
          example={route.example}
          categoryLabel={
            categories.find((entry) => entry.id === route.example?.category)?.label ?? ''
          }
          onPackageChange={navigatePackage}
          mode={mode}
          onModeChange={() => setMode((previous) => (previous === 'light' ? 'dark' : 'light'))}
          onMenuOpen={() => setMenuOpen(true)}
          onThemeOpen={supportsThemeStudio(route.playground) ? () => setThemeOpen(true) : undefined}
        />
        <aside className="desktop-sidebar">{navigation}</aside>
        <Drawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          slotProps={{ transition: { onEntered: () => mobileSearch.current?.focus() } }}
        >
          {route.example ? (
            <Sidebar
              {...sidebarProps}
              example={route.example}
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
            {route.status === 'charts' ? (
              route.example.kind === 'guide' ? (
                <ChartsGettingStarted key={`charts-${route.example.id}`} example={route.example} />
              ) : (
                <ChartsWorkspace key={`charts-${route.example.id}`} example={route.example} />
              )
            ) : route.example ? (
              route.example.kind === 'guide' ? (
                <GridGettingStarted key={route.example.id} example={route.example} />
              ) : (
                <GridWorkspace
                  key={route.example.id}
                  example={route.example}
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
    </Provider>
  );
}
