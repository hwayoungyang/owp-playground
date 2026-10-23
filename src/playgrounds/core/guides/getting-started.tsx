import { OwpErrorBoundary } from '@owp/core';
import { OwpCoreProvider, OwpStyleProvider, OwpUiProvider } from '@owp/core/contexts';
import type { OwpAppConfigs, OwpAppEnv } from '@owp/core/contexts';
import type { ReactNode } from 'react';

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

export function AppProviders({ children }: { readonly children: ReactNode }) {
  return (
    <OwpErrorBoundary>
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

export function PageRuntime({ children }: { readonly children: ReactNode }) {
  return <OwpUiProvider>{children}</OwpUiProvider>;
}
