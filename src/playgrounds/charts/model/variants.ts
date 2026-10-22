import { chartExecutionCatalog, type ChartCatalogEntry, type ChartExample } from '../catalog';

export const chartVariantGroups = [
  {
    id: 'bar',
    label: '구성 방식',
    choices: [
      { id: 'bar', label: 'Column' },
      { id: 'grouped-bar', label: '그룹 Column' },
      { id: 'horizontal-bar', label: 'Bar' },
      { id: 'grouped-horizontal-bar', label: '그룹 Bar' },
    ],
  },
  {
    id: 'stacked-bar',
    label: '구성 방식',
    choices: [
      { id: 'stacked-bar', label: '누적 Column' },
      { id: 'percent-stacked', label: '100% 누적 Column' },
      { id: 'stacked-horizontal-bar', label: '누적 Bar' },
    ],
  },
  {
    id: 'line',
    label: '구성 방식',
    choices: [
      { id: 'line', label: 'Line' },
      { id: 'multi-line', label: '다중 Line' },
    ],
  },
  {
    id: 'area',
    label: '구성 방식',
    choices: [
      { id: 'area', label: 'Area' },
      { id: 'stacked-area', label: '누적 Area' },
    ],
  },
  {
    id: 'doughnut',
    label: '구성 방식',
    choices: [
      { id: 'doughnut', label: 'Doughnut' },
      { id: 'pie', label: 'Pie' },
      { id: 'semi-circle', label: 'Semi-circle' },
      { id: 'multi-series-pie', label: '다중 고리 Doughnut' },
    ],
  },
  {
    id: 'legend',
    label: '구성 방식',
    choices: [
      { id: 'legend', label: '범례' },
      { id: 'legend-title', label: '범례 + 제목' },
      { id: 'legend-point-style', label: '범례 Point 스타일' },
      { id: 'legend-events', label: '범례로 막대 강조' },
    ],
  },
  {
    id: 'tooltip-content',
    label: '구성 방식',
    choices: [
      { id: 'tooltip-content', label: 'Tooltip 내용' },
      { id: 'tooltip-mode', label: 'Tooltip 탐색 방식' },
      { id: 'tooltip-position', label: 'Tooltip 위치' },
      { id: 'tooltip-point-style', label: 'Tooltip Point 스타일' },
    ],
  },
  {
    id: 'axis-range',
    label: '구성 방식',
    choices: [
      { id: 'axis-range', label: 'Axis 범위' },
      { id: 'axis-step', label: 'Axis 눈금 간격' },
      { id: 'tick-style', label: '눈금' },
      { id: 'grid-style', label: '격자' },
      { id: 'axis-titles', label: 'Axis 제목' },
    ],
  },
  {
    id: 'line-style',
    label: '구성 방식',
    choices: [
      { id: 'line-style', label: 'Line 선 패턴' },
      { id: 'line-interpolation', label: 'Line 보간' },
      { id: 'point-style', label: 'Point 스타일' },
      { id: 'scriptable-line', label: 'Line 조건부 색상' },
    ],
  },
  {
    id: 'chart-title',
    label: '구성 방식',
    choices: [
      { id: 'chart-title', label: 'Title' },
      { id: 'subtitle', label: 'Subtitle' },
    ],
  },
  {
    id: 'bar-radius',
    label: '구성 방식',
    choices: [
      { id: 'bar-radius', label: 'Column 모서리 radius' },
      { id: 'scriptable-bar', label: 'Column 조건부 색상' },
    ],
  },
  {
    id: 'png-export',
    label: '구성 방식',
    choices: [
      { id: 'png-export', label: 'PNG 내보내기' },
      { id: 'export-ref', label: '외부 버튼 PNG 내보내기' },
    ],
  },
  {
    id: 'ranking',
    label: '구성 방식',
    choices: [
      { id: 'ranking', label: '순위 Bar' },
      { id: 'top-n', label: '상위 N Column' },
    ],
  },
] as const;

export function findChartVariantGroup(id: string) {
  return chartVariantGroups.find((group) => group.choices.some((choice) => choice.id === id));
}

export function selectedChartExample(
  canonical: ChartExample,
  initialPreset?: string,
): ChartExample {
  const group = findChartVariantGroup(canonical.id);
  const selectedId =
    group?.choices.find((choice) => choice.id === initialPreset)?.id ?? canonical.id;
  return (
    chartExecutionCatalog.find(
      (example): example is ChartExample => example.kind === 'chart' && example.id === selectedId,
    ) ?? canonical
  );
}

export function inferChartVariantFromCode(
  canonical: ChartCatalogEntry,
  file: string,
): string | undefined {
  const group = findChartVariantGroup(canonical.id);
  return group?.choices.find((choice) => file === `playgrounds/charts/examples/${choice.id}.tsx`)
    ?.id;
}
