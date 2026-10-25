import { OwpErrorBoundary, OwpLoading, OwpPageCarded, OwpTable } from '@owp/components';
// UI는 Components에서 가져오고 앱 정책과 Data Router 오류 처리는 Core로 연결합니다.
import { OwpRouteErrorElement } from '@owp/core';
import { OwpCoreProvider, OwpStyleProvider, OwpUiProvider } from '@owp/core/contexts';
import type { OwpAppConfigs, OwpAppEnv } from '@owp/core/contexts';
import { useInitApp, usePageCardedPolicy } from '@owp/core/hooks';
import { errorBoundaryPolicy } from '@owp/core/utils';
import { Suspense, useState, type ReactNode } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';

const env: OwpAppEnv = {
  apiBaseUrl: '/api',
  accessTokenTransport: 'bearer',
  isI18nEnabled: true,
};
const configs: OwpAppConfigs = {
  routesConfig: [],
  navigationConfig: [],
  settingsConfig: {
    theme: { main: { palette: { mode: 'light' } } },
  },
};

export function PageRuntime({ children }: { readonly children?: ReactNode }) {
  useInitApp({ logoSrc: '/assets/logo.svg', title: 'OWP App' });
  return (
    <OwpUiProvider>
      <Suspense fallback={<OwpLoading variant="propagate" />}>{children ?? <Outlet />}</Suspense>
    </OwpUiProvider>
  );
}

export function ItemsPage() {
  const pagePolicy = usePageCardedPolicy({ isDirty: false });
  return (
    <>
      {pagePolicy.styles}
      <OwpPageCarded
        content={<OwpTable headers={{ name: '이름' }} rows={[{ name: '항목 A' }]} size="small" />}
        {...pagePolicy.props}
      />
    </>
  );
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: <PageRuntime />,
      errorElement: <OwpRouteErrorElement />,
      children: [{ index: true, element: <ItemsPage /> }],
    },
  ]);
}

export function AppProviders({ children }: { readonly children: ReactNode }) {
  return (
    <OwpErrorBoundary {...errorBoundaryPolicy}>
      <OwpCoreProvider
        configs={configs}
        env={env}
        queryClientConfig={{
          defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
        }}
      >
        <OwpStyleProvider root>{children}</OwpStyleProvider>
      </OwpCoreProvider>
    </OwpErrorBoundary>
  );
}

export function AppRoot() {
  const [router] = useState(createAppRouter);
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
