import { createTheme } from '@mui/material';
import { themesConfig, toolbarCuratedPresetKeys } from '@owp/core/configs/theme';
import type { OwpThemeType } from '@owp/theme/types';

export const coreThemePresets = Object.entries(themesConfig)
  .filter(([id]) => !toolbarCuratedPresetKeys.some((key) => key === id))
  .map(
    ([id, theme]) =>
      ({ id, theme, mode: theme.palette.mode === 'dark' ? 'dark' : 'light' }) as const,
  );

export function withCoreTableFontSize(main: OwpThemeType, fontSize: number): OwpThemeType {
  const table = main.table;
  return {
    ...main,
    table: {
      ...table,
      header: { ...table?.header, fontSize },
      cell: { ...table?.cell, fontSize },
      field: {
        ...table?.field,
        header: { ...table?.field?.header, fontSize },
        cell: { ...table?.field?.cell, fontSize },
      },
    },
  };
}

export function createCorePresetTheme(
  id: string,
  baseline: OwpThemeType,
  current: OwpThemeType,
): OwpThemeType {
  const fontSize = Number(current.table?.cell?.fontSize ?? 14);
  const preset = coreThemePresets.find((option) => option.id === id);
  if (!preset) return withCoreTableFontSize(baseline, fontSize);
  const palette = { ...baseline.palette, ...preset.theme.palette, mode: preset.mode };
  const resolved = createTheme({ palette: { ...preset.theme.palette, mode: preset.mode } }).palette;
  const header = {
    backgroundColor: resolved.primary.main,
    color: resolved.primary.contrastText,
    borderColor: resolved.divider,
  };
  const cell = { backgroundColor: resolved.background.paper, color: resolved.text.primary };
  const row = {
    backgroundColor: resolved.background.paper,
    hoverBackgroundColor: resolved.action.hover,
  };
  return withCoreTableFontSize(
    {
      ...current,
      palette,
      table: {
        ...current.table,
        borderColor: resolved.divider,
        header: { ...current.table?.header, ...header },
        cell: { ...current.table?.cell, ...cell },
        row: { ...current.table?.row, ...row },
        field: {
          ...current.table?.field,
          borderColor: resolved.divider,
          header: { ...current.table?.field?.header, ...header },
          cell: { ...current.table?.field?.cell, ...cell },
        },
      },
    },
    fontSize,
  );
}

function paletteSignature(main: OwpThemeType): string {
  const palette = main.palette;
  return JSON.stringify([
    palette?.mode,
    palette?.primary?.main,
    palette?.secondary?.main,
    palette?.background?.default,
    palette?.background?.paper,
    palette?.text?.primary,
    palette?.text?.secondary,
    palette?.divider,
  ]);
}

export function getCoreThemePresetId(main: OwpThemeType, baseline: OwpThemeType): string {
  if (paletteSignature(main) === paletteSignature(baseline)) return 'app-default';
  return (
    coreThemePresets.find(
      ({ theme, mode }) =>
        paletteSignature({
          ...baseline,
          palette: { ...baseline.palette, ...theme.palette, mode },
        }) === paletteSignature(main),
    )?.id ?? 'custom'
  );
}
