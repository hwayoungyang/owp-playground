import { OwpRouteErrorElement } from '@owp/core';
import { OwpErrorBoundary } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { CircularProgress } from '@mui/material';
import {
  OwpCoreProvider,
  OwpStyleProvider,
  OwpUiProvider,
  type OwpAppConfigs,
  type OwpAppEnv,
} from '@owp/core/contexts';
import { useInitApp } from '@owp/core/hooks';
import { OwpI18nProvider, type OwpI18nProviderProps } from '@owp/core/i18n';
import { useState, type ReactNode } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';

export const appEnv: OwpAppEnv = {
  apiBaseUrl: '/api',
  accessTokenTransport: 'bearer',
  isI18nEnabled: false,
};

export const appConfigs: OwpAppConfigs = {
  routesConfig: [],
  navigationConfig: [],
  settingsConfig: {
    theme: { main: { palette: { mode: 'light' } } },
  },
};

const i18nOptions: OwpI18nProviderProps['initOptions'] = {
  lng: 'ko',
  supportedLngs: ['ko', 'en'],
  fallbackLng: 'ko',
  ns: ['owp'],
  defaultNS: 'owp',
  keySeparator: false,
  resources: {
    ko: { owp: { '앱 준비 완료': '앱 준비 완료' } },
    en: { owp: { '앱 준비 완료': 'App ready' } },
  },
};

// Router의 element에서 실행하므로 Data Router context를 사용할 수 있습니다.
export function PageRuntime() {
  useInitApp({ logoSrc: '/assets/logo.svg', title: 'OWP App' });
  return (
    <OwpUiProvider
      // 서버 인증과 공통코드 API를 사용하지 않는 예제입니다.
      features={{ accessTokenGuard: false, commonCodes: false, autoLogout: false }}
      queryCancellation={{ routeChange: true, pageExit: true }}
    >
      <Outlet />
    </OwpUiProvider>
  );
}

export function AppProviders({ children }: { readonly children: ReactNode }) {
  return (
    <OwpI18nProvider
      scope="app"
      initOptions={i18nOptions}
      languageMap={{ kr: 'ko' }}
      fallback={<CircularProgress aria-label="OWP App" />}
    >
      <OwpCoreProvider
        env={appEnv}
        configs={appConfigs}
        queryClientConfig={{
          defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
        }}
      >
        <OwpStyleProvider root>{children}</OwpStyleProvider>
      </OwpCoreProvider>
    </OwpI18nProvider>
  );
}

function AppPage() {
  const { t } = useOwpTranslation();
  return <main>{t('앱 준비 완료')}</main>;
}

function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: <PageRuntime />,
      errorElement: <OwpRouteErrorElement />,
      children: [{ index: true, element: <AppPage /> }],
    },
  ]);
}

export function AppRoot() {
  const [router] = useState(createAppRouter);
  return (
    <OwpErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </OwpErrorBoundary>
  );
}
