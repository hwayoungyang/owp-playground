import {
  blue,
  brown,
  cyan,
  deepOrange,
  indigo,
  lightGreen,
  orange,
  pink,
  purple,
  teal,
} from '@mui/material/colors';
import { getContrastRatio } from '@mui/material/styles';
import type { ColorMode } from '../../../shared/theme/tokens';

const families = [
  blue,
  orange,
  teal,
  purple,
  lightGreen,
  pink,
  cyan,
  deepOrange,
  indigo,
  brown,
] as const;
const shades = {
  light: [600, 700, 800, 900],
  dark: [300, 200, 100, 50],
} as const;

/** 서로 다른 색상군을 우선 배치하고 차트 배경과 3:1 이상 대비되는 MUI shade를 선택합니다. */
export function createChartColors(mode: ColorMode, surface: string): readonly string[] {
  const levels = shades[mode];
  return families.map((family) => {
    const shade = levels.find((level) => getContrastRatio(family[level], surface) >= 3);
    return family[shade ?? (mode === 'dark' ? 50 : 900)];
  });
}
