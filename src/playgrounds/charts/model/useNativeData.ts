import { useOwpTranslation } from '@owp/components/hooks';
import { useMemo } from 'react';
import type { NativeData } from './chartTypes';
import { monthlyRecords } from './data';
import { useChartPalette } from './useCartesian';

export function useNativeData(type: 'bar' | 'line' | 'doughnut' = 'bar') {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const data = useMemo<NativeData>(
    () => ({
      labels: Array.from({ length: 6 }, (_, index) => t('{{month}}월', { month: index + 1 })),
      datasets: (type === 'doughnut' ? [0] : [0, 1]).map((index) => ({
        id: `line-${index}`,
        label: t(index === 0 ? '라인 A' : '라인 B'),
        data: monthlyRecords.slice(0, 6).map((row) => (index === 0 ? row.lineA : row.lineB)),
        backgroundColor: type === 'doughnut' ? palette.colors : palette.colors[index],
        borderColor: palette.colors[index],
        borderWidth: type === 'line' ? 2 : 0,
        borderRadius: 4,
        pointRadius: 3,
        tension: 0.25,
        maxBarThickness: 36,
      })),
    }),
    [t, palette, type],
  );
  return { data, palette };
}
