import type { SourcePolicy } from '../../../features/code/source-groups';
import type { GridExampleId } from '../catalog';

export const gridSourcePolicy = {
  coreDirectories: ['examples/configs/', 'examples/components/', 'examples/utils/', 'types/'],
  core: ['model/data.ts', 'model/apiData.ts', 'model/server.ts', 'model/worksheet-data.ts'],
} as const satisfies SourcePolicy;

export function getGridSourcePolicy(_id: GridExampleId): SourcePolicy {
  return gridSourcePolicy;
}
