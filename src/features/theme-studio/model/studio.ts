import type { Theme } from '@mui/material';
import type { z } from 'zod';
import { createMuiTheme } from '../../../shared/theme/themes';
import type { ColorMode } from '../../../shared/theme/tokens';
import { createPreviewGridTheme, getPreviewPalette, type PreviewThemeSettings } from './preview';
import { muiThemeSchema, themeFileSchema } from './schemas';

export function supportsThemeStudio(playground: { readonly id: string }): boolean {
  return playground.id === 'datagrid' || playground.id === 'components';
}

export function createPreviewMuiTheme(
  settings: PreviewThemeSettings,
  mode: ColorMode,
  selectionLabel: string,
): Theme {
  return createMuiTheme(
    getPreviewPalette(settings.preset, mode),
    mode,
    selectionLabel,
    settings.mui,
  );
}

export function editableMuiTheme(theme: Theme): z.infer<typeof muiThemeSchema> {
  const { primary, secondary, success, warning, error, info, background, text, divider, mode } =
    theme.palette;
  const palette = { primary, secondary, success, warning, error, info };
  return muiThemeSchema.parse({
    palette: {
      mode,
      ...Object.fromEntries(
        Object.entries(palette).map(([key, value]) => [
          key,
          { main: value.main, contrastText: value.contrastText },
        ]),
      ),
      background,
      text: { primary: text.primary, secondary: text.secondary },
      divider,
    },
    typography: {
      fontSize: theme.typography.fontSize,
    },
    shape: theme.shape,
  });
}

export function exportTheme(settings: PreviewThemeSettings, mode: ColorMode): string {
  const mui = editableMuiTheme(createPreviewMuiTheme(settings, mode, 'Select row'));
  return JSON.stringify(
    themeFileSchema.parse({
      format: 'owp-theme',
      version: 1,
      preset: settings.preset,
      mui,
      dataGrid: createPreviewGridTheme(settings, mode),
      dataGridProps: { radius: settings.radius ?? 0 },
    }),
    null,
    2,
  );
}

export function importTheme(source: string): PreviewThemeSettings {
  const config = themeFileSchema.parse(JSON.parse(source));
  return {
    preset: config.preset,
    mode: config.mui.palette.mode,
    headerColor: null,
    grid: config.dataGrid,
    mui: config.mui,
    radius: config.dataGridProps.radius,
  };
}
