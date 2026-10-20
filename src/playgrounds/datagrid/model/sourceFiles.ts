import type { SourcePolicy } from '../../../features/code/source-groups';
import type { GridExampleId } from '../catalog';

const taskExamples: readonly GridExampleId[] = [
  'overview',
  'selection',
  'editing',
  'ref-changes',
  'save-changes',
];

export const gridSourcePolicy = {
  roots: ['runtime/GridPreview.tsx', 'runtime/useGridController.ts'],
  core: [
    'runtime/GridPreview.tsx',
    'runtime/useGridController.ts',
    'model/gridStates.ts',
    'model/server.ts',
    'model/worksheet-data.ts',
  ],
} as const satisfies SourcePolicy;

const taskSourcePolicy = {
  roots: [],
  core: [
    'examples/configs/taskOverview.ts',
    'examples/configs/taskSelection.ts',
    'examples/configs/taskEditing.ts',
    'examples/configs/taskChanges.ts',
    'examples/configs/taskSave.ts',
    'examples/configs/taskList.tsx',
    'types/index.ts',
    'model/data.ts',
    'model/apiData.ts',
    'model/server.ts',
  ],
} as const satisfies SourcePolicy;

export function getGridSourcePolicy(id: GridExampleId): SourcePolicy {
  return taskExamples.includes(id) ? taskSourcePolicy : gridSourcePolicy;
}
