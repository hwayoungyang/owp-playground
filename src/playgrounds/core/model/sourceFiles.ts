import type { SourcePolicy } from '../../../features/code/source-groups';

export const coreSourcePolicy = {
  coreDirectories: ['model/', 'data/'],
  core: ['runtime/CoreProviders.tsx'],
  roots: ['runtime/CoreProviders.tsx'],
} as const satisfies SourcePolicy;
