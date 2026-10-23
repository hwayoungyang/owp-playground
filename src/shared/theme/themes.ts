import { createTheme, darken, getContrastRatio, lighten, type ThemeOptions } from '@mui/material';
import { amber, deepOrange } from '@mui/material/colors';
import type { OwpGridThemeConfigType } from '@owp/theme/types';
import { type ColorMode, fonts, type Palette } from './tokens';

export function createMuiTheme(
  palette: Palette,
  mode: ColorMode,
  selectionLabel: string,
  overrides?: ThemeOptions,
) {
  return createTheme({
    palette: {
      mode,
      primary: { main: palette.ink, contrastText: palette.canvas },
      background: { default: palette.canvas, paper: palette.canvas },
      text: { primary: palette.ink, secondary: palette.secondary },
      divider: palette.line,
      ...overrides?.palette,
    },
    shape: { borderRadius: 4, ...overrides?.shape },
    typography: {
      htmlFontSize: 10,
      fontFamily: fonts.ui,
      fontSize: 14,
      button: { textTransform: 'none', fontSize: 13, fontWeight: 500 },
      ...overrides?.typography,
    },
    components: {
      MuiCheckbox: { defaultProps: { slotProps: { input: { 'aria-label': selectionLabel } } } },
      MuiButton: {
        defaultProps: { size: 'small', disableElevation: true },
        styleOverrides: {
          root: { minHeight: 32, paddingInline: 12 },
          outlined: { borderColor: palette.line },
        },
      },
      MuiIconButton: {
        defaultProps: { size: 'small' },
        styleOverrides: { root: { borderRadius: 4 } },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiSelect: {
        defaultProps: { size: 'small' },
        styleOverrides: { select: { fontSize: 13, paddingBlock: 7 } },
      },
      MuiChip: {
        defaultProps: { size: 'small' },
        styleOverrides: { root: { borderRadius: 4, height: 23, fontSize: 12 } },
      },
      MuiTooltip: { defaultProps: { arrow: true } },
      MuiSnackbar: { defaultProps: { anchorOrigin: { vertical: 'top', horizontal: 'center' } } },
      MuiDrawer: { defaultProps: { transitionDuration: 180 } },
      ...overrides?.components,
    },
  });
}

export function createGridTheme(
  palette: Palette,
  headerColor: string | null = null,
  mode: ColorMode = 'light',
): OwpGridThemeConfigType {
  const background = headerColor ?? palette.chrome;
  const borderColor = mode === 'dark' ? lighten(palette.line, 0.24) : palette.line;
  const foreground = headerColor
    ? getContrastRatio(background, '#171717') >= getContrastRatio(background, '#ffffff')
      ? '#171717'
      : '#ffffff'
    : palette.secondary;
  return {
    header: {
      backgroundColor: background,
      color: foreground,
      borderColor,
      fontSize: 12,
      fontWeight: 500,
      height: 36,
      sortIconColor: foreground,
    },
    body: {
      backgroundColor: palette.canvas,
      color: palette.ink,
      fillBackgroundColor: palette.canvas,
    },
    row: { backgroundColor: palette.canvas, solidBackgroundColor: palette.chrome },
    cell: { borderColor, fontSize: 13 },
    panel: {
      backgroundColor: palette.canvas,
      color: palette.secondary,
      inactiveFilterColor: palette.secondary,
      activeColor: palette.ink,
    },
    enumMenu: {
      hoverBackgroundColor: palette.hover,
      selectedBackgroundColor: palette.subtle,
    },
    filter: {
      backgroundColor: palette.canvas,
      color: palette.ink,
      bottomBorderColor: borderColor,
      bottomBorderWidth: 2,
      operatorColor: palette.secondary,
    },
    state: {
      hoverBackgroundColor: palette.hover,
      hoverCellBackgroundColor: palette.hover,
      hoverCellBorderColor: borderColor,
      selectedRowBackgroundColor: palette.hover,
      selectedCellBackgroundColor: palette.subtle,
      focusedRowBackgroundColor: palette.hover,
      focusedCellBackgroundColor: palette.subtle,
      focusedCellBorderColor: palette.secondary,
      editingCellBorderColor: palette.ink,
      hintBackgroundColor: palette.chrome,
    },
    editable: { backgroundColor: palette['warning-wash'] },
    changed: {
      backgroundColor: palette['success-wash'],
      color: palette.success,
      rowBackgroundColor: palette.canvas,
    },
    drag: {
      handleColor: palette.secondary,
      handleActiveColor: mode === 'dark' ? amber.A200 : darken(deepOrange[900], 0.12),
    },
    scrollbar: {
      backgroundColor: palette.chrome,
      thumbColor: palette.line,
      thumbHoverColor: palette.muted,
      frameBorderColor: borderColor,
    },
  };
}
