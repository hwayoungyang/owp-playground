import { useTheme } from '@mui/material/styles';
import { useChartPalette as useOwpChartPalette } from '@owp/charts';
import { useMemo } from 'react';
import { createChartColors } from './chartColors';

/** 공통 MUI 차트 색상을 적용하고 글자·표면·상태 색상은 현재 theme을 따릅니다. */
export function useChartPalette() {
  const palette = useOwpChartPalette();
  const { mode } = useTheme().palette;
  return useMemo(
    () => ({ ...palette, colors: createChartColors(mode, palette.surface) }),
    [mode, palette],
  );
}
