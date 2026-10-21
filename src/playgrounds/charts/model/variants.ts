import { chartExecutionCatalog, type ChartCatalogEntry, type ChartExample } from '../catalog';

export const chartVariantGroups = [
  {
    id: 'bar',
    label: '구성 방식',
    choices: [
      { id: 'bar', label: 'Column' },
      { id: 'grouped-bar', label: 'Grouped column' },
      { id: 'horizontal-bar', label: 'Bar' },
      { id: 'grouped-horizontal-bar', label: 'Grouped bar' },
    ],
  },
  {
    id: 'stacked-bar',
    label: '구성 방식',
    choices: [
      { id: 'stacked-bar', label: 'Stacked column' },
      { id: 'percent-stacked', label: '100% stacked column' },
      { id: 'stacked-horizontal-bar', label: 'Stacked bar' },
    ],
  },
  {
    id: 'line',
    label: '구성 방식',
    choices: [
      { id: 'line', label: 'Line' },
      { id: 'multi-line', label: 'Multi-line' },
    ],
  },
  {
    id: 'area',
    label: '구성 방식',
    choices: [
      { id: 'area', label: 'Area' },
      { id: 'stacked-area', label: 'Stacked area' },
    ],
  },
  {
    id: 'doughnut',
    label: '구성 방식',
    choices: [
      { id: 'doughnut', label: 'Doughnut' },
      { id: 'pie', label: 'Pie' },
      { id: 'semi-circle', label: 'Semi-circle' },
      { id: 'multi-series-pie', label: 'Multi-ring doughnut' },
    ],
  },
  {
    id: 'legend',
    label: '구성 방식',
    choices: [
      { id: 'legend', label: 'Legend' },
      { id: 'legend-title', label: 'Legend title' },
      { id: 'legend-point-style', label: 'Legend point style' },
      { id: 'legend-events', label: 'Legend events' },
    ],
  },
  {
    id: 'tooltip-content',
    label: '구성 방식',
    choices: [
      { id: 'tooltip-content', label: 'Tooltip content' },
      { id: 'tooltip-mode', label: 'Tooltip interaction' },
      { id: 'tooltip-position', label: 'Tooltip position' },
      { id: 'tooltip-point-style', label: 'Tooltip point style' },
    ],
  },
  {
    id: 'axis-range',
    label: '구성 방식',
    choices: [
      { id: 'axis-range', label: 'Axis range' },
      { id: 'axis-step', label: 'Axis step size' },
      { id: 'tick-style', label: 'Ticks' },
      { id: 'grid-style', label: 'Grid' },
      { id: 'axis-titles', label: 'Axis titles' },
    ],
  },
  {
    id: 'line-style',
    label: '구성 방식',
    choices: [
      { id: 'line-style', label: 'Line dash' },
      { id: 'line-interpolation', label: 'Line interpolation' },
      { id: 'point-style', label: 'Point style' },
      { id: 'scriptable-line', label: 'Conditional line colors' },
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
      { id: 'bar-radius', label: 'Bar border radius' },
      { id: 'scriptable-bar', label: 'Conditional bar colors' },
    ],
  },
  {
    id: 'png-export',
    label: '구성 방식',
    choices: [
      { id: 'png-export', label: 'PNG export' },
      { id: 'export-ref', label: 'External PNG export' },
    ],
  },
  {
    id: 'ranking',
    label: '구성 방식',
    choices: [
      { id: 'ranking', label: 'Ranking bar' },
      { id: 'top-n', label: 'Top N column' },
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
