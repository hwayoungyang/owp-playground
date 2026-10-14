export const colors = {
  light: {
    canvas: '#ffffff',
    chrome: '#fafafa',
    subtle: '#f5f5f5',
    ink: '#171717',
    secondary: '#666666',
    muted: '#737373',
    line: '#e5e5e5',
    hover: '#f0f0f0',
    success: '#176b54',
    'success-wash': '#edf6f1',
    warning: '#885c0d',
    'warning-wash': '#faf2df',
    danger: '#a63c3c',
    'danger-wash': '#fbeeee',
    blue: '#2453a6',
    'blue-wash': '#eaf1ff',
    purple: '#7542a2',
    'purple-wash': '#f4ecfc',
  },
  dark: {
    canvas: '#141414',
    chrome: '#191919',
    subtle: '#232323',
    ink: '#ededed',
    secondary: '#b0b0b0',
    muted: '#a3a3a3',
    line: '#333333',
    hover: '#2b2b2b',
    success: '#9ad5bb',
    'success-wash': '#21352b',
    warning: '#e7c177',
    'warning-wash': '#3a3022',
    danger: '#f1abab',
    'danger-wash': '#3b2525',
    blue: '#accaff',
    'blue-wash': '#202f49',
    purple: '#d6b7ef',
    'purple-wash': '#352640',
  },
} as const;

export const codeColors = {
  background: '#17191c',
  ink: '#e3e7ed',
  blue: '#91b9f4',
  mint: '#a8d4b8',
  purple: '#c2adeb',
  muted: '#9da5b4',
} as const;
export const fonts = {
  ui: '"Geist Variable", Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
  mono: '"Geist Mono Variable", ui-monospace, SFMono-Regular, monospace',
} as const;
export type ColorMode = keyof typeof colors;
export type Palette = { readonly [Key in keyof typeof colors.light]: string };
