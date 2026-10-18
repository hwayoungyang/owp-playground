import { ChartFrame } from '@owp/charts';
import type { ChartLegendOptions } from '@owp/charts/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect, useMemo } from 'react';
import { chartMotion } from '../model/chartMotion';
import type {
  NativeChartType,
  NativeData,
  NativeInstance,
  NativeOptions,
  NativePlugin,
} from '../model/chartTypes';
import { nativeSnapshot } from '../model/nativeSnapshot';
import type { ChartExampleProps } from '../model/types';
import { useAvailableChartHeight } from './useAvailableChartHeight';

type ChartCanvasProps = ChartExampleProps & {
  readonly type: NativeChartType;
  readonly data: NativeData;
  readonly options?: NativeOptions;
  readonly plugins?: NativePlugin[];
  readonly chartRef?:
    | ((chart: NativeInstance | undefined) => void)
    | { current: NativeInstance | undefined };
  readonly radial?: boolean | 'semi-circle' | 'radar';
  readonly categoryLabel?: (label: string, index: number) => string;
  readonly legendFormatter?: ChartLegendOptions['formatter'];
  readonly recordLegendHover?: boolean;
};

/** 차트 높이·데이터·이벤트 기록을 연결하고 패키지의 애니메이션 기본값을 적용합니다. */
export function ChartCanvas({
  data,
  type,
  options,
  plugins,
  chartRef,
  radial = false,
  categoryLabel,
  legendFormatter,
  recordLegendHover,
  onData,
  onRecord,
}: ChartCanvasProps) {
  const { t } = useOwpTranslation();
  const plot = useAvailableChartHeight(Boolean(radial));
  useEffect(() => onData?.(nativeSnapshot(data)), [data, onData]);
  const config = useMemo<NativeOptions>(
    () => ({
      ...chartMotion,
      ...options,
      onClick(event, elements, chart) {
        onRecord?.(
          'click',
          elements.map((item) => `${item.datasetIndex}:${item.index}`).join(', '),
        );
        options?.onClick?.call(this, event, elements, chart);
      },
    }),
    [options, onRecord],
  );
  const nativeLegend = options?.plugins?.legend;
  return (
    <div
      ref={plot}
      className={`chart-canvas chart-native${radial ? ' chart-canvas-doughnut' : ''}${typeof radial === 'string' ? ` chart-canvas-${radial}` : ''}`}
    >
      <ChartFrame
        preset="owp"
        type={type}
        data={data}
        datasetIdKey="id"
        options={config}
        plugins={plugins}
        chartRef={chartRef}
        height="100%"
        showExportButton={false}
        interactionLayer={false}
        xAxisLabelMarker={false}
        aria-label={t('시각화 차트. 데이터 탭에서 각 값을 확인할 수 있습니다.')}
        legend={
          nativeLegend?.display === false
            ? false
            : {
                position: nativeLegend?.position === 'top' ? 'top' : 'bottom',
                title: nativeLegend?.title?.display
                  ? Array.isArray(nativeLegend.title.text)
                    ? nativeLegend.title.text.join(' ')
                    : nativeLegend.title.text
                  : undefined,
                formatter:
                  legendFormatter ??
                  (categoryLabel
                    ? (label, item) =>
                        item.dataIndex === undefined ? label : categoryLabel(label, item.dataIndex)
                    : undefined),
                onClick: (item) => onRecord?.('legend-click', String(item.label)),
                onHover: recordLegendHover
                  ? (item) => onRecord?.('legend-hover', String(item.label))
                  : undefined,
              }
        }
      />
    </div>
  );
}
