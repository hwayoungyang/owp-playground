import type { Theme } from '@mui/material';
import type { z } from 'zod';
import { createMuiTheme } from '../../../shared/theme/themes';
import type { ColorMode } from '../../../shared/theme/tokens';
import { createReferenceMuiOptions } from './reference';
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
    settings.preset === 'reference' && mode === 'light'
      ? createReferenceMuiOptions(settings.mui)
      : settings.mui,
  );
}

export function editableMuiTheme(theme: Theme): z.infer<typeof muiThemeSchema> {
  const {
    primary,
    secondary,
    success,
    warning,
    error,
    info,
    inputFocus,
    button,
    common,
    background,
    text,
    divider,
    mode,
  } = theme.palette;
  const palette = { primary, secondary, success, warning, error, info };
  return muiThemeSchema.parse({
    palette: {
      mode,
      ...Object.fromEntries(
        Object.entries(palette).map(([key, value]) => [
          key,
          {
            main: value.main,
            light: value.light,
            dark: value.dark,
            contrastText: value.contrastText,
          },
        ]),
      ),
      background,
      text: { primary: text.primary, secondary: text.secondary, disabled: text.disabled },
      common,
      ...(inputFocus ? { inputFocus } : {}),
      ...(button ? { button } : {}),
      divider,
    },
    typography: {
      fontSize: theme.typography.fontSize,
    },
    shape: theme.shape,
  });
}

export function updateMuiTheme(
  theme: z.infer<typeof muiThemeSchema>,
  path: readonly string[],
  next: unknown,
) {
  function replace(current: unknown, remaining: readonly string[]): unknown {
    const [field, ...rest] = remaining;
    if (field === undefined) return next;
    if (typeof current !== 'object' || current === null) return current;
    const previous = Object.entries(current).find(([key]) => key === field)?.[1];
    return { ...current, [field]: replace(previous, rest) };
  }
  return muiThemeSchema.safeParse(replace(theme, path));
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
