import { Drawer } from '@mui/material';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  defaultPreviewTheme,
  type PreviewThemeSettings,
} from '../features/theme-studio/model/preview';
import { supportsThemeStudio } from '../features/theme-studio/model/studio';
import { categories, sampleAliases, sampleCatalog } from '../playgrounds/datagrid/catalog';
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

const Workspace = lazy(() =>
  import('../playgrounds/datagrid/runtime/Workspace').then((module) => ({
    default: module.Workspace,
  })),
);

const GettingStarted = lazy(() =>
  import('../playgrounds/datagrid/guides/GettingStarted').then((module) => ({
    default: module.GettingStarted,
  })),
);
const ThemeStudio = lazy(() =>
  import('../features/theme-studio/ThemeStudio').then((module) => ({
    default: module.ThemeStudio,
  })),
);

export function App() {
  const { t, i18n } = useTranslation('app');
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
  const navigateSample = (id: string) => navigate(getPlaygroundRoute(route.playground, id));
  const sidebarProps = {
    playground: route.playground,
    samples: sampleCatalog,
    categories,
    exampleCount: sampleCatalog.filter((entry) => entry.kind === 'grid').length,
    getSampleUrl: (id: string) =>
      createPlaygroundUrl(location.href, getPlaygroundRoute(route.playground, id)).href,
  };
  const navigatePackage = (next: PlaygroundPackage) => {
    if (next.id !== route.playground.id) navigate(getPlaygroundRoute(next));
  };
  const navigation = route.sample ? (
    <Sidebar
      {...sidebarProps}
      sample={route.sample}
      onNavigate={navigateSample}
      searchRef={desktopSearch}
    />
  ) : (
    <PackageSidebar playground={route.playground} />
  );
  useEffect(() => {
    const normalizeUrl = (next: PlaygroundRoute) => {
      const url = createPlaygroundUrl(location.href, next);
      const sampleId = new URLSearchParams(location.search).get('sample');
      if (sampleId && next.sample && sampleAliases[sampleId] === next.sample.id) {
        url.searchParams.set('sample', sampleId);
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
    document.title = `${t(route.sample?.title ?? route.playground.title)} — OWP Playground`;
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
          sample={route.sample}
          categoryLabel={
            categories.find((entry) => entry.id === route.sample?.category)?.label ?? ''
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
          {route.sample ? (
            <Sidebar
              {...sidebarProps}
              sample={route.sample}
              onNavigate={navigateSample}
              searchRef={mobileSearch}
            />
          ) : (
            <PackageSidebar playground={route.playground} />
          )}
        </Drawer>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {!route.sample && (
            <div className="package-heading">
              <div>
                <h1>
                  {route.playground.title}
                  {route.playground.version && (
                    <span className="package-version">v{route.playground.version}</span>
                  )}
                </h1>
                {!route.sample && <p>{t('샘플을 차례로 추가하고 있어요.')}</p>}
              </div>
              {!route.sample && <div className="package-note">{route.playground.name}</div>}
            </div>
          )}
          <Suspense
            fallback={
              <div className="workspace-loading" role="status">
                {t('샘플을 불러오는 중…')}
              </div>
            }
          >
            {route.sample ? (
              route.sample.kind === 'guide' ? (
                <GettingStarted key={route.sample.id} sample={route.sample} />
              ) : (
                <Workspace
                  key={route.sample.id}
                  sample={route.sample}
                  theme={previewTheme}
                  onThemeChange={setPreviewTheme}
                  onThemeOpen={() => setThemeOpen(true)}
                />
              )
            ) : (
              <PackageNotice onDataGrid={() => navigatePackage(dataGridPackage)} />
            )}
          </Suspense>
          <footer className="main-footer">
            <span>React · TypeScript · Material UI</span>
          </footer>
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
