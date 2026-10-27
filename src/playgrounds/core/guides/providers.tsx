import { OwpRouteErrorElement } from '@owp/core';
import {
  OwpCoreProvider,
  OwpStyleProvider,
  OwpUiProvider,
  type OwpAppConfigs,
  type OwpAppEnv,
} from '@owp/core/contexts';
import { useInitApp } from '@owp/core/hooks';
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

// Router의 element에서 실행하므로 Data Router context를 사용할 수 있습니다.
export function PageRuntime() {
  useInitApp({ logoSrc: '/assets/logo.svg', title: 'OWP App' });
  return (
    <OwpUiProvider queryCancellation={{ routeChange: true, pageExit: true }}>
      <Outlet />
    </OwpUiProvider>
  );
}

export function AppProviders({ children }: { readonly children: ReactNode }) {
  return (
    <OwpCoreProvider
      env={appEnv}
      configs={appConfigs}
      queryClientConfig={{
        defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
      }}
    >
      <OwpStyleProvider root>{children}</OwpStyleProvider>
    </OwpCoreProvider>
  );
}

function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: <PageRuntime />,
      errorElement: <OwpRouteErrorElement />,
      children: [{ index: true, element: <main>OWP App</main> }],
    },
  ]);
}

export function AppRoot() {
  const [router] = useState(createAppRouter);
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
