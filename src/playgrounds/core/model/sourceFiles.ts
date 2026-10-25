import type { SourcePolicy } from '../../../features/code/source-groups';

export const coreSourcePolicy = {
  coreDirectories: ['model/', 'data/'],
  core: ['runtime/CoreProviders.tsx', 'runtime/CoreEnvironmentScope.tsx'],
  roots: ['runtime/CoreProviders.tsx', 'runtime/CoreEnvironmentScope.tsx'],
} as const satisfies SourcePolicy;
