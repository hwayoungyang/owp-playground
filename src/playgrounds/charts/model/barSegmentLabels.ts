import { decomposeColor, getContrastRatio } from '@mui/material/styles';
import type {
  ChartDataLabelsContext,
  ChartDataLabelsPluginOptions,
  ChartPalette,
} from '@owp/charts/types';

const labelFont = { size: 12, weight: 600 } as const;
const labelPadding = 4;

/** 구간 안에 들어가는 라벨 방향을 반환하며, 양쪽 방향 모두 맞지 않으면 숨깁니다. */
export function getBarSegmentLabelRotation({
  width,
  height,
  textWidth,
}: {
  readonly width: number;
  readonly height: number;
  readonly textWidth: number;
}): 0 | -90 | null {
  const textLength = textWidth + labelPadding * 2;
  if (textLength <= width && labelFont.size <= height) return 0;
  if (textLength <= height && labelFont.size <= width) return -90;
  return null;
}

/** MUI의 RGB·RGBA fill을 surface와 합성해 대비가 높은 흑백 라벨 색을 고릅니다. */
export function getBarSegmentLabelColor(background: string, surface: string): string {
  const color = decomposeColor(background);
  const base = decomposeColor(surface).values;
  const opacity = color.type === 'rgba' ? (color.values[3] ?? 1) : 1;
  const channels = color.values
    .slice(0, 3)
    .map((channel, index) => Math.round(channel * opacity + (base[index] ?? 0) * (1 - opacity)));
  const composite = `rgb(${channels.join(', ')})`;
  return getContrastRatio(composite, '#000000') >= getContrastRatio(composite, '#ffffff')
    ? '#000000'
    : '#ffffff';
}

/** 실제 Bar 구간의 크기와 색에 맞춰 내부 값 라벨을 설정합니다. Line 값은 표시하지 않습니다. */
export function createBarSegmentLabels({
  enabled,
  palette,
  formatter = String,
}: {
  readonly enabled: boolean;
  readonly palette: ChartPalette;
  readonly formatter?: (value: number) => string;
}): ChartDataLabelsPluginOptions {
  const rotation = (context: ChartDataLabelsContext) => {
    const meta = context.chart.getDatasetMeta(context.datasetIndex);
    const value = context.dataset.data[context.dataIndex];
    if (
      meta.type !== 'bar' ||
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value === 0
    ) {
      return null;
    }
    const bounds = meta.data[context.dataIndex]?.getProps(['width', 'height'], true);
    if (typeof bounds?.width !== 'number' || typeof bounds.height !== 'number') return null;
    const { ctx } = context.chart;
    ctx.save();
    ctx.font = `${labelFont.weight} ${labelFont.size}px ${palette.fontFamily}`;
    const textWidth = ctx.measureText(formatter(value)).width;
    ctx.restore();
    return getBarSegmentLabelRotation({
      width: Math.abs(bounds.width),
      height: Math.abs(bounds.height),
      textWidth,
    });
  };
  return {
    anchor: 'center',
    align: 'center',
    clamp: true,
    clip: true,
    padding: labelPadding,
    font: { ...labelFont, family: palette.fontFamily },
    display: (context) => enabled && rotation(context) !== null,
    rotation: (context) => rotation(context) ?? 0,
    color: (context) => {
      const background = context.chart.getDatasetMeta(context.datasetIndex).data[context.dataIndex]
        ?.options.backgroundColor;
      return getBarSegmentLabelColor(
        typeof background === 'string'
          ? background
          : (palette.colors[context.datasetIndex] ?? palette.surface),
        palette.surface,
      );
    },
    formatter,
  };
}
