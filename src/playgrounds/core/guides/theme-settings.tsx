import {
  useChangeOwpTheme,
  useGetCurrentSettings,
  useGetDefaultSettings,
  useResetSettings,
  useSetSettings,
} from '@owp/core/hooks';
import type { OwpSettingsInput } from '@owp/core/types';

// OwpCoreProvider의 configs.settingsConfig에 전달합니다.
export const settingsConfig = {
  direction: 'ltr',
  customScrollbars: true,
  theme: {
    main: {
      palette: { mode: 'light' },
      table: { header: { fontSize: 14 }, cell: { fontSize: 14 } },
    },
    navbar: { palette: { mode: 'light' } },
    toolbar: { palette: { mode: 'dark' } },
    footer: { palette: { mode: 'light' } },
  },
} satisfies OwpSettingsInput;

// OwpCoreProvider 안에서 사용합니다. 화면 적용에는 OwpStyleProvider도 필요합니다.
export function useThemeSettings() {
  const current = useGetCurrentSettings();
  const defaults = useGetDefaultSettings();
  const setSettings = useSetSettings();
  const changeTheme = useChangeOwpTheme();
  const reset = useResetSettings();

  function setMainMode(mode: 'light' | 'dark') {
    setSettings({
      ...current,
      theme: {
        ...current.theme,
        main: {
          ...current.theme.main,
          palette: { ...current.theme.main.palette, mode },
        },
      },
    });
  }

  function applyCurrentThemeAsDefault() {
    // Core 10.2.0은 테마와 함께 현재 layout·customScrollbars 등도 기본값에 반영합니다.
    changeTheme(current.theme);
  }

  return { current, defaults, setMainMode, applyCurrentThemeAsDefault, reset };
}
