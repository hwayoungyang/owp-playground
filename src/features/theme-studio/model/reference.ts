import { alpha, createTheme, type ThemeOptions } from '@mui/material';

// 참조 프로젝트의 configs/theme/settings.ts에 정의된 main 팔레트입니다.
export const referencePalette = {
  mode: 'light',
  text: {
    primary: 'rgb(17, 24, 39)',
    secondary: 'rgb(107, 114, 128)',
    disabled: 'rgb(149, 156, 169)',
  },
  common: { black: 'rgb(17, 24, 39)', white: 'rgb(255, 255, 255)' },
  background: { paper: '#FFFFFF', default: '#f6f7f9' },
  primary: { main: '#232A2D', light: '#4F585C', dark: '#111618', contrastText: '#FFFFFF' },
  secondary: {
    main: '#e5b924',
    light: '#edc953',
    dark: '#ae8c1a',
    contrastText: 'rgb(17, 24, 39)',
  },
  inputFocus: { main: '#212121' },
  success: { main: '#2f7d31' },
  info: { main: '#9c27b0', contrastText: '#fff' },
  warning: { main: '#ed7d31', contrastText: '#fff' },
  error: { main: '#c00000' },
  button: {
    primary: { main: '#232A2D', contrastText: '#FFFFFF' },
    secondary: { main: '#1976d2', contrastText: 'rgb(255, 255, 255)' },
    success: { main: '#2f7d31' },
    warning: { main: '#ed7d31', contrastText: '#fff' },
    error: { main: '#c00000' },
    info: { main: '#9c27b0', contrastText: '#fff' },
  },
} as const satisfies NonNullable<ThemeOptions['palette']>;

export function createReferenceMuiOptions(overrides?: ThemeOptions): ThemeOptions {
  const { palette } = createTheme(
    { palette: referencePalette },
    { palette: overrides?.palette ?? {} },
  );
  return {
    ...overrides,
    palette,
    components: {
      MuiButton: {
        defaultProps: { size: 'small', disableElevation: true },
        styleOverrides: {
          root: ({ theme, ownerState }) => {
            const role = Object.entries(theme.palette.button ?? {}).find(
              ([key]) => key === ownerState.color,
            )?.[1];
            const metrics = { minHeight: 32, paddingInline: 12 };
            if (!role?.main) return metrics;
            const hover = { backgroundColor: alpha(role.main, 0.08) };
            const color =
              ownerState.variant === 'contained'
                ? {
                    backgroundColor: role.main,
                    color: role.contrastText ?? theme.palette.getContrastText(role.main),
                    '&:hover, &:focus': { backgroundColor: role.dark ?? role.main },
                  }
                : ownerState.variant === 'outlined'
                  ? {
                      color: role.main,
                      borderColor: alpha(role.main, 0.52),
                      '&:hover, &:focus': { ...hover, borderColor: role.main },
                    }
                  : { color: role.main, '&:hover, &:focus': hover };
            return { ...metrics, '&:not(.Mui-disabled)': color };
          },
        },
      },
      MuiOutlinedInput: {
        defaultProps: { color: 'secondary' },
        styleOverrides: {
          root: ({ theme }) => ({
            '&:not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.inputFocus.main,
            },
            '&:hover:not(.Mui-disabled, .Mui-error) .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.inputFocus.main,
            },
            '&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.inputFocus.main,
            },
          }),
        },
      },
      ...overrides?.components,
    },
  };
}
