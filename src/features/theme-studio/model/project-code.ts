export const themeUsage = [
  {
    file: 'src/configs/theme/grid.ts',
    code: `import type { OwpGridThemeConfigType } from '@owp/theme/types';
import config from './owp-theme.json';

export const defaultDataGridTheme =
  config.dataGrid satisfies OwpGridThemeConfigType;`,
  },
  {
    file: 'src/configs/theme/overrides.ts',
    code: `import type { OwpSettingsInput } from '@owp/core/types';
import config from './owp-theme.json';
import { defaultDataGridTheme } from './grid';

export const themeOverrides = {
  theme: {
    main: {
      palette: {
        ...config.mui.palette,
        mode: config.mui.palette.mode === 'dark' ? 'dark' : 'light',
      },
      dataGrid: defaultDataGridTheme,
    },
  },
} satisfies OwpSettingsInput;`,
  },
  {
    file: 'AppProviders.tsx',
    code: `// merge를 직접 사용하는 프로젝트는 pnpm add es-toolkit으로 설치합니다.
import { merge } from 'es-toolkit/compat';
import { getResolvedThemePreviewSettingsConfig }
  from '@owp/core/configs/theme';
import { OwpCoreProvider, OwpStyleProvider }
  from '@owp/core/contexts';
import { defaultSettingsConfig as settingsConfig }
  from '@/configs/theme/settings';
import { themeOverrides } from '@/configs/theme/overrides';

const resolvedSettingsConfig =
  getResolvedThemePreviewSettingsConfig(
    merge({}, settingsConfig, themeOverrides),
  );

<OwpCoreProvider env={appEnv} configs={{
  routesConfig,
  navigationConfig,
  settingsConfig: resolvedSettingsConfig,
}}>
  <OwpStyleProvider root>{children}</OwpStyleProvider>
</OwpCoreProvider>`,
  },
  {
    file: 'OwpDataGrid.tsx',
    code: `import { OwpDataGrid } from '@owp/datagrid';
import config from '@/configs/theme/owp-theme.json';

<OwpDataGrid columns={columns} rows={rows}
  getRowId={(row) => row.id} {...config.dataGridProps} />`,
  },
] as const;

export const componentsThemeUsage = [
  {
    file: 'ProjectStyles.tsx',
    code: `import { createTheme, type ThemeOptions }
  from '@mui/material/styles';
import { OwpStyleProvider } from '@owp/core/contexts';
import { useGetMainTheme } from '@owp/core/hooks';
import type { ReactNode } from 'react';
import config from '@/configs/theme/owp-theme.json';

const options: ThemeOptions = {
  ...config.mui,
  palette: {
    ...config.mui.palette,
    mode: config.mui.palette.mode === 'dark' ? 'dark' : 'light',
  },
};

function ProjectStyles({ children }: { children: ReactNode }) {
  const mainTheme = useGetMainTheme();
  const theme = createTheme(mainTheme, options);
  return (
    <OwpStyleProvider theme={theme} root>
      {children}
    </OwpStyleProvider>
  );
}`,
  },
] as const;
