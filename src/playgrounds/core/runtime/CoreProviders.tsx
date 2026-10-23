import { OwpCoreProvider, OwpDialogsProvider, type OwpAppConfigs } from '@owp/core/contexts';
import { STORAGE_KEYS } from '@owp/core/constants';
import { useGetCurrentLanguage, useSetDefaultSettings } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useMemo, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { createGridTheme } from '../../../shared/theme/themes';
import { colors } from '../../../shared/theme/tokens';

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

export function CoreProviders({ children }: { readonly children: ReactNode }) {
  const theme = useTheme();
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
    <MemoryRouter>
      <OwpCoreProvider
        configs={configs}
        styledEngineProviderProps={{ injectFirst: false, enableCssLayer: false }}
        env={{
          apiBaseUrl: window.location.origin,
          isAutoLogoutEnabled: false,
          isAccessTokenGuardEnabled: false,
          isI18nEnabled: true,
          isI18nLanguageSwitcherEnabled: true,
          isErrorMessageEnabled: false,
        }}
        queryClientConfig={{
          defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
        }}
      >
        <OwpDialogsProvider>
          <CoreSettingsBridge configs={configs}>
            <CoreLanguageBridge>{children}</CoreLanguageBridge>
          </CoreSettingsBridge>
        </OwpDialogsProvider>
      </OwpCoreProvider>
    </MemoryRouter>
  );
}
