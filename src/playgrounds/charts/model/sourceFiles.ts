import type { SourcePolicy } from '../../../features/code/source-groups';

export const chartSourcePolicy = {
  core: [
    'runtime/ChartCanvas.tsx',
    'model/useCartesian.ts',
    'model/useNativeData.ts',
    'model/useAreaRadialExample.ts',
    'model/useRadialData.ts',
    'model/statistics.ts',
    'model/factoryData.ts',
    'model/forecastData.ts',
    'model/referenceData.ts',
  ],
} as const satisfies SourcePolicy;
