import type { NativeData, NativeValue } from './chartTypes';
import type { ChartSnapshot } from './types';

function isPoint(value: NativeValue): value is { x: number; y: number | null; r?: number } {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function nativeSnapshot(data: NativeData): ChartSnapshot {
  if (data.datasets.some((dataset) => dataset.data.some(isPoint))) {
    const coordinates = [
      ...new Set(
        data.datasets.flatMap((dataset) => dataset.data.filter(isPoint).map((point) => point.x)),
      ),
    ].sort((left, right) => left - right);
    const labelsByX = new Map(
      data.datasets[0]?.data.flatMap((point, index) =>
        isPoint(point) && data.labels?.[index] !== undefined
          ? [[point.x, String(data.labels[index])]]
          : [],
      ),
    );
    return {
      labels: coordinates.map((x) => labelsByX.get(x) ?? String(x)),
      series: data.datasets.flatMap((dataset) => {
        const points = new Map(dataset.data.filter(isPoint).map((point) => [point.x, point]));
        const label = dataset.label ?? '';
        return [
          { label, values: coordinates.map((x) => points.get(x)?.y ?? null) },
          ...(dataset.data.some((point) => isPoint(point) && point.r !== undefined)
            ? [{ label: `${label} (r)`, values: coordinates.map((x) => points.get(x)?.r ?? null) }]
            : []),
        ];
      }),
    };
  }
  const labels = (
    (data.labels?.length ? data.labels : undefined) ??
    data.datasets[0]?.data.map((point, index) =>
      point !== null && typeof point === 'object' && !Array.isArray(point) ? point.x : index + 1,
    ) ??
    []
  ).map(String);
  const series = data.datasets.flatMap((dataset) => {
    const label = dataset.label ?? '';
    if (dataset.data.some(Array.isArray)) {
      return [0, 1].map((edge) => ({
        label: `${label} [${edge}]`,
        values: dataset.data.map((point) => (Array.isArray(point) ? (point[edge] ?? null) : null)),
      }));
    }
    return [
      {
        label,
        values: dataset.data.map((point) =>
          point === null || typeof point === 'number'
            ? point
            : Array.isArray(point)
              ? null
              : point.y,
        ),
      },
    ];
  });
  return { labels, series };
}
