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
  'api-highlight': '#f2cf66',
} as const;

export const shellTokens = {
  light: {
    page: '#f8f9fb',
    surface: '#ffffff',
    navigation: '#f4f5f7',
    ink: '#20232a',
    secondary: '#5f6774',
    muted: '#5f6877',
    line: '#e0e4eb',
    hover: '#e9ecf1',
    selected: '#e3e7ee',
    focus: '#635bba',
    shadow: '0 1px 2px #20232a06, 0 8px 24px #20232a05',
  },
  dark: {
    page: '#101114',
    surface: '#1a1c21',
    navigation: '#15171b',
    ink: '#edeef2',
    secondary: '#acb2be',
    muted: '#9da5b4',
    line: '#2c3038',
    hover: '#22252c',
    selected: '#2b2f38',
    focus: '#a6a0ff',
    shadow: '0 1px 0 #ffffff04, 0 8px 24px #0000001f',
  },
} as const;

export const shellShape = {
  'control-radius': '6px',
  'item-radius': '8px',
  'panel-radius': '12px',
} as const;

export const fonts = {
  ui: '"Geist Variable", Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
  mono: '"Geist Mono Variable", ui-monospace, SFMono-Regular, monospace',
} as const;
export type ColorMode = keyof typeof colors;
export type Palette = { readonly [Key in keyof typeof colors.light]: string };
