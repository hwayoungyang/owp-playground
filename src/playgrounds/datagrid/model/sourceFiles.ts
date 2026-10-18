import type { SourcePolicy } from '../../../features/code/source-groups';

export const gridSourcePolicy = {
  roots: ['runtime/GridPreview.tsx', 'runtime/useGridController.ts'],
  core: [
    'runtime/GridPreview.tsx',
    'runtime/useGridController.ts',
    'model/server.ts',
    'model/worksheet-data.ts',
  ],
} as const satisfies SourcePolicy;
