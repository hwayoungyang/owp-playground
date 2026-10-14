import type { ThemeOptions } from '@mui/material';
import { defaultGridTheme } from '@owp/theme';
import type { OwpGridThemeConfigType } from '@owp/theme/types';
import { z } from 'zod';
import { createGridTheme } from '../../../shared/theme/themes';
import { type ColorMode, colors, type Palette } from '../../../shared/theme/tokens';
import { presetAccents } from './presets';

export const previewPresetSchema = z.enum([
  'inherit',
  'neutral',
  'hankum',
  'quartz',
  'alpine',
  'balham',
  'material',
  'slate',
  'blue',
  'mint',
]);
export type PreviewPreset = z.infer<typeof previewPresetSchema>;
export type PreviewThemeSettings = {
  readonly preset: PreviewPreset;
  readonly mode: ColorMode;
  readonly headerColor: string | null;
  readonly grid?: OwpGridThemeConfigType;
  readonly mui?: ThemeOptions;
  readonly radius?: number;
};
export const defaultPreviewTheme: PreviewThemeSettings = {
  preset: 'inherit',
  mode: 'light',
  headerColor: null,
};
export const previewPresetLabels: Readonly<Record<PreviewPreset, string>> = {
  inherit: '화면과 같게',
  neutral: 'Neutral',
  hankum: '한금',
  quartz: 'Quartz',
  alpine: 'Alpine',
  balham: 'Balham',
  material: 'Material',
  slate: 'Slate',
  blue: 'Blue',
  mint: 'Mint',
};
export const previewPresetDescriptions: Readonly<Record<PreviewPreset, string>> = {
  inherit: '화면의 밝기와 색상을 따릅니다.',
  neutral: '기본 회색과 흰색으로 구성합니다.',
  hankum: '한금 소비앱의 블루 헤더와 편집 색상을 적용합니다.',
  quartz: '보라색 헤더와 또렷한 글자로 구성합니다.',
  alpine: '올리브색 헤더와 선명한 경계선으로 구성합니다.',
  balham: '앰버색 헤더로 간결하게 구성합니다.',
  material: '청록색 헤더와 넉넉한 간격으로 구성합니다.',
  slate: '차분한 청회색을 적용합니다.',
  blue: '밝은 블루를 적용합니다.',
  mint: '부드러운 민트를 적용합니다.',
};
export const colorModeSchema = z.enum(['light', 'dark']);
export const headerColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

const headerStyles: Readonly<
  Partial<Record<PreviewPreset, NonNullable<OwpGridThemeConfigType['header']>>>
> = {
  hankum: { height: 33, fontSize: 14, fontWeight: 400 },
  quartz: { height: 40, fontSize: 13, fontWeight: 600 },
  alpine: { height: 36, fontSize: 12, fontWeight: 600 },
  balham: { height: 30, fontSize: 12, fontWeight: 500 },
  material: { height: 44, fontSize: 13, fontWeight: 500 },
};

export function getPreviewPalette(preset: PreviewPreset, mode: ColorMode): Palette {
  const base = colors[mode];
  if (preset === 'inherit') return base;
  return { ...base, ...presetAccents[preset][mode] };
}

export function getPreviewHeaderColor(preset: PreviewPreset, mode: ColorMode): string {
  if (preset === 'hankum' && mode === 'light') return defaultGridTheme.header.backgroundColor;
  return getPreviewPalette(preset, mode).chrome;
}

export function createPreviewGridTheme(
  settings: PreviewThemeSettings,
  mode: ColorMode,
): OwpGridThemeConfigType {
  const palette = getPreviewPalette(settings.preset, mode);
  const theme = createGridTheme(palette, settings.headerColor);
  const base =
    settings.preset === 'hankum' && mode === 'light'
      ? {
          ...defaultGridTheme,
          panel: { ...defaultGridTheme.panel, inactiveFilterColor: palette.secondary },
          header: {
            ...defaultGridTheme.header,
            ...(settings.headerColor === null
              ? {}
              : {
                  backgroundColor: settings.headerColor,
                  color: theme.header?.color,
                  sortIconColor: theme.header?.sortIconColor,
                }),
          },
        }
      : { ...theme, header: { ...theme.header, ...headerStyles[settings.preset] } };
  const nativeBase = expandHoverAliases(base);
  return expandHoverAliases(
    Object.fromEntries(
      Object.entries({ ...nativeBase, ...settings.grid }).map(([group, fields]) => [
        group,
        { ...Object.entries(nativeBase).find(([key]) => key === group)?.[1], ...fields },
      ]),
    ),
  );
}

function expandHoverAliases(theme: OwpGridThemeConfigType): OwpGridThemeConfigType {
  const { hoverBackgroundColor, hoverBorderColor, ...state } = theme.state ?? {};
  return {
    ...theme,
    state: {
      ...state,
      ...(hoverBackgroundColor
        ? {
            hoverRowBackgroundColor: hoverBackgroundColor,
            hoverCellBackgroundColor: hoverBackgroundColor,
          }
        : {}),
      ...(hoverBorderColor
        ? { hoverRowBorderColor: hoverBorderColor, hoverCellBorderColor: hoverBorderColor }
        : {}),
    },
  };
}
