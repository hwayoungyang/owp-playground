import { ChartFrame, ChartLegend } from '@owp/charts';
import type { ChartLegendItem } from '@owp/charts/types';
import { useOwpTranslation } from '@owp/components/hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chartMotion } from '../model/chartMotion';
import type {
  NativeChartType,
  NativeData,
  NativeInstance,
  NativeOptions,
  NativeValue,
} from '../model/chartTypes';
import { nativeSnapshot } from '../model/nativeSnapshot';
import type { ChartExampleProps } from '../model/types';
import { useAvailableChartHeight } from './useAvailableChartHeight';

type LegendPreviewProps = ChartExampleProps & {
  readonly data: NativeData;
  readonly options?: NativeOptions;
  readonly title?: string;
  readonly titleAlign?: 'left' | 'center' | 'right';
  readonly highlightBars?: boolean;
  readonly recordLegendHover?: boolean;
};

export function LegendPreview({
  data,
  options,
  title,
  titleAlign = 'center',
  highlightBars = false,
  recordLegendHover = false,
  onData,
  onRecord,
}: LegendPreviewProps) {
  const { t } = useOwpTranslation();
  const plot = useAvailableChartHeight(false);
  const [chart, setChart] = useState<NativeInstance | null>(null);
  const highlightedChart = useRef<NativeInstance | null>(null);
  const clearHighlight = useCallback(() => {
    const activeChart = highlightedChart.current;
    highlightedChart.current = null;
    if (!activeChart?.canvas || !activeChart.ctx) return;
    activeChart.setActiveElements([]);
    activeChart.update('none');
  }, []);
  const handleChartRef = useCallback(
    (instance: NativeInstance | undefined) => {
      clearHighlight();
      setChart(instance ?? null);
    },
    [clearHighlight],
  );
  useEffect(() => onData?.(nativeSnapshot(data)), [data, onData]);
  useEffect(() => {
    if (!highlightBars) clearHighlight();
  }, [highlightBars, clearHighlight]);
  useEffect(() => clearHighlight, [clearHighlight]);
  const config = useMemo<NativeOptions>(
    () => ({
      ...chartMotion,
      ...options,
      onClick(event, elements, instance) {
        onRecord?.(
          'click',
          elements.map((item) => `${item.datasetIndex}:${item.index}`).join(', '),
        );
        options?.onClick?.call(this, event, elements, instance);
      },
    }),
    [options, onRecord],
  );
  const handleLegendHover = (item: ChartLegendItem) => {
    if (recordLegendHover) onRecord?.('legend-hover', String(item.label));
    if (
      !highlightBars ||
      !chart?.canvas ||
      !chart.ctx ||
      item.hidden ||
      !chart.isDatasetVisible(item.datasetIndex)
    ) {
      clearHighlight();
      return;
    }
    const metadata = chart.getDatasetMeta(item.datasetIndex);
    if (!metadata.controller || metadata.data.length === 0) {
      clearHighlight();
      return;
    }
    chart.setActiveElements(
      metadata.data.map((_, index) => ({ datasetIndex: item.datasetIndex, index })),
    );
    highlightedChart.current = chart;
    chart.update('none');
  };
  return (
    <div ref={plot} className="chart-canvas chart-native chart-legend-preview">
      <div className="chart-legend-preview__plot">
        <ChartFrame<NativeChartType, NativeValue[]>
          preset="owp"
          type="bar"
          data={data}
          datasetIdKey="id"
          options={config}
          chartRef={handleChartRef}
          height="100%"
          showExportButton={false}
          interactionLayer={false}
          xAxisLabelMarker={false}
          aria-label={t('차트 데이터는 데이터 탭에서 확인할 수 있습니다.')}
          legend={false}
        />
      </div>
      <div
        className="chart-legend-preview__legend"
        onMouseLeave={clearHighlight}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) clearHighlight();
        }}
      >
        {title && (
          <p className="chart-legend-preview__title" style={{ textAlign: titleAlign }}>
            {title}
          </p>
        )}
        <ChartLegend<NativeChartType, NativeValue[]>
          chart={chart}
          data={data}
          type="bar"
          align="center"
          position="bottom"
          onClick={(item) => {
            clearHighlight();
            onRecord?.('legend-click', String(item.label));
          }}
          onHover={recordLegendHover || highlightBars ? handleLegendHover : undefined}
        />
      </div>
    </div>
  );
}
