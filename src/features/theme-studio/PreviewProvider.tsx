import { ThemeProvider, useTheme } from '@mui/material';
import { OwpThemeProvider } from '@owp/theme';
import { type ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createPreviewGridTheme,
  getPreviewPalette,
  type PreviewThemeSettings,
} from './model/preview';
import { createPreviewMuiTheme } from './model/studio';

export function PreviewProvider({
  value,
  children,
}: {
  readonly value: PreviewThemeSettings;
  readonly children: ReactNode;
}) {
  const appMode = useTheme().palette.mode;
  const { t } = useTranslation('app');
  const mode = value.mui?.palette?.mode ?? (value.preset === 'inherit' ? appMode : value.mode);
  const palette = useMemo(() => getPreviewPalette(value.preset, mode), [value.preset, mode]);
  const selectionLabel = t('행 선택');
  const theme = useMemo(() => {
    const previewTheme = createPreviewMuiTheme(value, mode, selectionLabel);
    previewTheme.components = {
      ...previewTheme.components,
      MuiButton: {
        ...previewTheme.components?.MuiButton,
        defaultProps: {
          ...previewTheme.components?.MuiButton?.defaultProps,
          variant: 'outlined',
        },
      },
    };
    return previewTheme;
  }, [value, mode, selectionLabel]);
  const gridTheme = useMemo(() => createPreviewGridTheme(value, mode), [value, mode]);
  return (
    <div
      className="sample-theme"
      data-preview-preset={value.preset}
      data-preview-mode={mode}
      style={{
        colorScheme: mode,
        ...Object.fromEntries(
          Object.entries(palette).map(([key, color]) => [`--pg-${key}`, color]),
        ),
      }}
    >
      <ThemeProvider theme={theme}>
        <OwpThemeProvider dataGrid={gridTheme}>{children}</OwpThemeProvider>
      </ThemeProvider>
    </div>
  );
}
