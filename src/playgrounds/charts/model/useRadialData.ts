import type { RadialItem } from '@owp/charts/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { useChartPalette } from './useCartesian';

export const processOutput = [1523, 916, 610, 503, 425, 389, 301, 182, 151] as const;
export const previousOutput = [1120, 870, 640, 540, 460, 380, 320, 250, 190] as const;

/** 공정별 원본 수량과 locale 변경에 영향을 받지 않는 항목 ID를 제공합니다. */
export function useRadialData() {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  const labels = ['절단', '선삭', '밀링', '용접', '도장', '조립', '검사', '포장', '이송'].map(
    (name) => t(name),
  );
  const createItems = (
    values: readonly (number | null)[],
    colors: readonly string[] = palette.colors,
  ): RadialItem[] =>
    labels.map((label, index) => ({
      id: `process-${index}`,
      label,
      value: values[index] ?? null,
      color: colors[index % colors.length],
    }));
  return { palette, labels, createItems };
}
