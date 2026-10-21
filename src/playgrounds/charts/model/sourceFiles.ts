import type { SourcePolicy } from '../../../features/code/source-groups';

export const chartSourcePolicy = {
  coreDirectories: ['examples/native/'],
  core: [
    'runtime/ChartCanvas.tsx',
    'runtime/TimeChart.tsx',
    'model/timeScaleData.ts',
    'model/useCartesian.ts',
    'model/histogramData.ts',
    'model/useNativeData.ts',
    'model/useAreaRadialExample.ts',
    'model/useRadialData.ts',
    'model/statistics.ts',
    'model/factoryData.ts',
    'model/forecastData.ts',
    'model/referenceData.ts',
  ],
} as const satisfies SourcePolicy;
