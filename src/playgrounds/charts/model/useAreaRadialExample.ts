import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect } from 'react';
import { useAvailableChartHeight } from '../runtime/useAvailableChartHeight';
import { chartMotion } from './chartMotion';
import type { ChartExampleProps, ChartSnapshot } from './types';

/** 확장 차트 샘플의 데이터 탭·기록·높이와 기본 애니메이션을 연결합니다. */
export function useAreaRadialExample(
  snapshot: ChartSnapshot,
  props: ChartExampleProps,
  radial: boolean | 'radar' | 'semi-circle' = false,
) {
  const { t } = useOwpTranslation();
  const plot = useAvailableChartHeight(Boolean(radial));
  useEffect(() => props.onData?.(snapshot), [snapshot, props.onData]);
  return {
    plot,
    className: `chart-canvas chart-native${radial ? ' chart-canvas-doughnut' : ''}${typeof radial === 'string' ? ` chart-canvas-${radial}` : ''}`,
    frame: {
      height: '100%' as const,
      showExportButton: false,
      'aria-label': t('시각화 차트. 데이터 탭에서 각 값을 확인할 수 있습니다.'),
      legend: {
        position: 'bottom' as const,
        align: 'center' as const,
        onClick: (item: { readonly label: unknown }) =>
          props.onRecord?.('legend-click', String(item.label)),
      },
    },
    options: {
      ...chartMotion,
      onClick: (
        _event: unknown,
        elements: readonly {
          readonly datasetIndex: number;
          readonly index: number;
        }[],
      ) =>
        props.onRecord?.(
          'click',
          elements.map((item) => `${item.datasetIndex}:${item.index}`).join(', '),
        ),
    },
  };
}
