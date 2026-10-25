import { OwpRouteErrorElement } from '@owp/core';
import {
  OwpCoreProvider,
  OwpDialogsProvider,
  OwpUiProvider,
  type OwpAppConfigs,
} from '@owp/core/contexts';
import { STORAGE_KEYS } from '@owp/core/constants';
import { useGetCurrentLanguage, useSetDefaultSettings } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom';
import { Alert, useTheme } from '@mui/material';
import { createGridTheme } from '../../../shared/theme/themes';
import { colors } from '../../../shared/theme/tokens';
import {
  createCorePolicyRoutes,
  createCoreProviderEnv,
  resolveCoreProviderMode,
  type CoreProviderMode,
} from '../model/policy';

const CoreRouterChildrenContext = createContext<ReactNode>(null);

function PolicyRouteRoot() {
  const children = useContext(CoreRouterChildrenContext);
  return (
    <OwpUiProvider
      queryCancellation={{
        routeChange: true,
        pageExit: true,
      }}
    >
      {children}
    </OwpUiProvider>
  );
}

function RouteNormalOutlet() {
  const { t } = useOwpTranslation();
  return <Alert severity="success">{t('라우트 loader와 화면이 정상 상태입니다.')}</Alert>;
}

function CorePolicyRouter({ children }: { readonly children: ReactNode }) {
  const { i18n } = useOwpTranslation();
  const [router] = useState(() =>
    createMemoryRouter(
      createCorePolicyRoutes({
        rootElement: <PolicyRouteRoot />,
        normalElement: <RouteNormalOutlet />,
        errorElement: <OwpRouteErrorElement />,
        getRouteErrorMessage: () =>
          i18n.t('라우트 loader에서 데이터를 불러오지 못해 OwpRouteErrorElement로 전환했습니다.', {
            ns: 'app',
          }),
      }),
      { initialEntries: ['/list'] },
    ),
  );
  return (
    <CoreRouterChildrenContext.Provider value={children}>
      <RouterProvider router={router} />
    </CoreRouterChildrenContext.Provider>
  );
}

function CoreSettingsBridge({
  configs,
  children,
}: {
  readonly configs: OwpAppConfigs;
  readonly children: ReactNode;
}) {
  const setDefaults = useSetDefaultSettings();
  useEffect(() => {
    if (configs.settingsConfig) setDefaults(configs.settingsConfig);
  }, [configs, setDefaults]);
  return children;
}

function CoreLanguageBridge({ children }: { readonly children: ReactNode }) {
  const { i18n } = useOwpTranslation();
  const current = useGetCurrentLanguage();
  const language = i18n.language === 'en' ? 'en' : 'kr';
  useEffect(() => {
    const url = new URL(window.location.href);
    const appLanguage = language === 'en' ? 'en' : 'ko';
    if (url.searchParams.get('lang') !== appLanguage) {
      url.searchParams.set('lang', appLanguage);
      window.history.replaceState(null, '', url);
    }
    if ((current.id === 'en' ? 'en' : 'kr') === language) return;
    const value = JSON.stringify(
      language === 'en'
        ? { id: 'en', title: 'English', flag: 'EN' }
        : { id: 'kr', title: '한국어', flag: 'KR' },
    );
    try {
      localStorage.setItem(STORAGE_KEYS.currentLanguage, value);
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEYS.currentLanguage,
          newValue: value,
          storageArea: localStorage,
        }),
      );
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
    }
  }, [current.id, language]);
  return children;
}

export function CoreProviders({
  children,
  exampleId,
  mode,
}: {
  readonly children: ReactNode;
  readonly exampleId?: string;
  readonly mode?: CoreProviderMode;
}) {
  const theme = useTheme();
  const resolvedMode = resolveCoreProviderMode(exampleId, mode);
  const configs = useMemo(() => {
    const table = {
      borderColor: theme.palette.divider,
      header: {
        fontSize: 14,
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.text.primary,
        borderColor: theme.palette.divider,
      },
      cell: { fontSize: 14, backgroundColor: theme.palette.background.paper },
      row: {
        backgroundColor: theme.palette.background.paper,
        hoverBackgroundColor: theme.palette.action.hover,
      },
      field: {
        borderColor: theme.palette.divider,
        header: {
          fontSize: 14,
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.primary,
          borderColor: theme.palette.divider,
        },
        cell: { fontSize: 14, backgroundColor: theme.palette.background.paper },
      },
    };
    return {
      routesConfig: [],
      navigationConfig: [],
      settingsConfig: {
        theme: {
          main: {
            palette: { mode: theme.palette.mode },
            table,
            dataGrid: createGridTheme(colors[theme.palette.mode], null, theme.palette.mode),
          },
        },
      },
    } satisfies OwpAppConfigs;
  }, [theme]);
  return (
    <OwpCoreProvider
      configs={configs}
      styledEngineProviderProps={{ injectFirst: false, enableCssLayer: false }}
      env={createCoreProviderEnv(resolvedMode, window.location.origin)}
      queryClientConfig={{
        defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
      }}
    >
      <CoreSettingsBridge configs={configs}>
        <CoreLanguageBridge>
          {resolvedMode === 'policy' ? (
            <CorePolicyRouter>{children}</CorePolicyRouter>
          ) : (
            <MemoryRouter>
              <OwpDialogsProvider>{children}</OwpDialogsProvider>
            </MemoryRouter>
          )}
        </CoreLanguageBridge>
      </CoreSettingsBridge>
    </OwpCoreProvider>
  );
}
