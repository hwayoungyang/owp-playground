import { completedPlaygroundPackages } from '../src/playgrounds/packages.ts';
import { gridCatalog } from '../src/playgrounds/datagrid/catalog.ts';
import { getGridSourcePolicy } from '../src/playgrounds/datagrid/model/sourceFiles.ts';
import { chartExecutionCatalog } from '../src/playgrounds/charts/catalog.ts';
import { chartSourcePolicy } from '../src/playgrounds/charts/model/sourceFiles.ts';
import { coreCatalog } from '../src/playgrounds/core/catalog.ts';
import { coreSourcePolicy } from '../src/playgrounds/core/model/sourceFiles.ts';

const adapters = new Map([
  [
    'core',
    {
      catalog: coreCatalog,
      sourcePolicy: () => coreSourcePolicy,
      runtimeFiles: [],
      referenceOnlyPackages: ['@owp/components'],
      contractPackages: ['@owp/theme', '@owp/date-picker', '@owp/utils', '@owp/excel'],
    },
  ],
  [
    'datagrid',
    {
      catalog: gridCatalog,
      sourcePolicy: getGridSourcePolicy,
      runtimeFiles: [
        'runtime/useGridController.ts',
        'runtime/GridPreview.tsx',
        'runtime/GridToolbar.tsx',
      ],
      referenceOnlyPackages: [],
      contractPackages: [
        '@owp/components',
        '@owp/theme',
        '@owp/date-picker',
        '@owp/utils',
        '@owp/excel',
      ],
    },
  ],
  [
    'charts',
    {
      catalog: chartExecutionCatalog,
      sourcePolicy: () => chartSourcePolicy,
      runtimeFiles: [],
      referenceOnlyPackages: [],
      contractPackages: ['@owp/components', '@owp/utils'],
    },
  ],
]);

export const knowledgePackageAdapters = completedPlaygroundPackages.map((entry) => {
  const adapter = adapters.get(entry.id);
  if (!adapter)
    throw new TypeError(`완료된 Playground의 Knowledge adapter가 없습니다: ${entry.id}`);
  return { ...entry, ...adapter };
});
