import { useOwpTranslation } from '@owp/components/hooks';
import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import { OwpThemeProvider } from '@owp/theme';
import { type ReactNode, useEffect, useMemo } from 'react';
import { createGridTheme, createMuiTheme } from '../../shared/theme/themes';
import { type ColorMode, codeColors, colors, fonts } from '../../shared/theme/tokens';

export function Provider({
  mode,
  children,
}: {
  readonly mode: ColorMode;
  readonly children: ReactNode;
}) {
  const { t } = useOwpTranslation();
  const palette = colors[mode];
  const selectionLabel = t('행 선택');
  const theme = useMemo(
    () => createMuiTheme(palette, mode, selectionLabel),
    [palette, mode, selectionLabel],
  );
  const gridTheme = useMemo(() => createGridTheme(palette, null, mode), [palette, mode]);
  useEffect(() => {
    document.documentElement.dataset.colorMode = mode;
  }, [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          ':root': {
            ...Object.fromEntries(
              Object.entries(palette).map(([key, value]) => [`--pg-${key}`, value]),
            ),
            ...Object.fromEntries(
              Object.entries(codeColors).map(([key, value]) => [`--code-${key}`, value]),
            ),
            '--font-ui': fonts.ui,
            '--font-mono': fonts.mono,
          },
        }}
      />
      <OwpThemeProvider dataGrid={gridTheme}>{children}</OwpThemeProvider>
    </ThemeProvider>
  );
}
