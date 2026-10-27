import type { ThemeOptions } from '@mui/material';
import { defaultOwpGridTheme } from '@owp/theme';
import type { OwpGridThemeConfigType } from '@owp/theme/types';
import { z } from 'zod';
import { createGridTheme } from '../../../shared/theme/themes';
import { type ColorMode, colors, type Palette } from '../../../shared/theme/tokens';
import { presetAccents, presetHeaderColors } from './presets';

export const generalPreviewPresets = [
  'carbon',
  'industrial',
  'owp-navy',
  'owp-teal',
  'owp-plum',
  'olive',
  'bronze',
  'sand',
  'solarized',
  'contrast',
] as const;
export const previewPresetSchema = z.enum(['inherit', ...generalPreviewPresets, 'reference']);
export type PreviewPreset = z.infer<typeof previewPresetSchema>;
export const previewPresetFileSchema = z.union([
  previewPresetSchema,
  z
    .enum([
      'neutral',
      'quartz',
      'alpine',
      'balham',
      'material',
      'slate',
      'blue',
      'mint',
      'nord',
      'hankum',
    ])
    .transform((preset): PreviewPreset => legacyPresets[preset]),
]);
const legacyPresets = {
  hankum: 'reference',
  neutral: 'carbon',
  quartz: 'carbon',
  alpine: 'carbon',
  balham: 'sand',
  material: 'industrial',
  slate: 'industrial',
  blue: 'industrial',
  mint: 'carbon',
  nord: 'industrial',
} as const satisfies Readonly<Record<string, PreviewPreset>>;
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
  reference: '참조 앱',
  carbon: 'Carbon',
  industrial: 'Industrial',
  'owp-navy': 'Navy',
  'owp-teal': 'Teal',
  'owp-plum': 'Plum',
  olive: 'Olive',
  bronze: 'Bronze',
  sand: 'Sand',
  solarized: 'Solarized',
  contrast: 'High Contrast',
};
export const previewPresetDescriptions: Readonly<Record<PreviewPreset, string>> = {
  inherit: '화면의 밝기와 색상을 따릅니다.',
  reference: '참조 앱의 그리드와 컴포넌트 색상을 적용합니다.',
  carbon: '회색 계열의 헤더와 본문 색상을 적용합니다.',
  industrial: '차분한 청회색 계열의 헤더와 배경색을 적용합니다.',
  'owp-navy': '짙은 네이비 헤더와 차분한 배경색을 적용합니다.',
  'owp-teal': '짙은 청록색 헤더와 은은한 선택 색상을 적용합니다.',
  'owp-plum': '짙은 자주색 헤더를 적용합니다.',
  olive: '올리브색 헤더와 차분한 본문 색상을 적용합니다.',
  bronze: '브론즈색 헤더와 따뜻한 배경색을 적용합니다.',
  sand: '따뜻한 회색 계열의 헤더와 본문 색상을 적용합니다.',
  solarized: '밝은 모드는 아이보리색, 어두운 모드는 청록색 배경을 적용합니다.',
  contrast: '색상 대비와 테두리를 강조해 글자와 셀을 구분하기 쉽게 표시합니다.',
};
export const colorModeSchema = z.enum(['light', 'dark']);
export const headerColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

const headerStyles: Readonly<
  Partial<Record<PreviewPreset, NonNullable<OwpGridThemeConfigType['header']>>>
> = {
  reference: { height: 33, fontSize: 14, fontWeight: 400 },
  carbon: { height: 36, fontSize: 13, fontWeight: 600 },
  industrial: { height: 36, fontSize: 13, fontWeight: 600 },
  'owp-navy': { height: 36, fontSize: 13, fontWeight: 600 },
  'owp-teal': { height: 36, fontSize: 13, fontWeight: 600 },
  'owp-plum': { height: 36, fontSize: 13, fontWeight: 600 },
  olive: { height: 36, fontSize: 13, fontWeight: 600 },
  bronze: { height: 36, fontSize: 13, fontWeight: 600 },
  sand: { height: 36, fontSize: 13, fontWeight: 600 },
  solarized: { height: 36, fontSize: 13, fontWeight: 600 },
  contrast: {
    height: 40,
    fontSize: 13,
    fontWeight: 600,
    sortIconInactiveOpacity: 1,
    resizeHandleColor: 'currentColor',
  },
};

const headerColors: Readonly<Partial<Record<PreviewPreset, Readonly<Record<ColorMode, string>>>>> =
  presetHeaderColors;

export function getPreviewPalette(preset: PreviewPreset, mode: ColorMode): Palette {
  const base = colors[mode];
  if (preset === 'inherit') return base;
  return { ...base, ...presetAccents[preset][mode] };
}

export function getPreviewHeaderColor(preset: PreviewPreset, mode: ColorMode): string {
  if (preset === 'reference' && mode === 'light') return defaultOwpGridTheme.header.backgroundColor;
  return headerColors[preset]?.[mode] ?? getPreviewPalette(preset, mode).chrome;
}

export function createPreviewGridTheme(
  settings: PreviewThemeSettings,
  mode: ColorMode,
): OwpGridThemeConfigType {
  const palette = getPreviewPalette(settings.preset, mode);
  const theme = createGridTheme(
    palette,
    settings.headerColor ?? headerColors[settings.preset]?.[mode] ?? null,
    mode,
  );
  if (settings.preset !== 'inherit' && settings.preset !== 'reference') {
    theme.state = {
      ...theme.state,
      selectedRowBackgroundColor: palette.subtle,
      focusedRowBackgroundColor: palette.subtle,
      focusedCellBorderColor: palette.blue,
      editingCellBorderColor: palette.blue,
    };
  }
  const base =
    settings.preset === 'reference' && mode === 'light'
      ? {
          ...defaultOwpGridTheme,
          header: {
            ...defaultOwpGridTheme.header,
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
