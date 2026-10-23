import { completedPlaygroundPackages } from '../src/playgrounds/packages.ts';
import { gridCatalog } from '../src/playgrounds/datagrid/catalog.ts';
import { getGridSourcePolicy } from '../src/playgrounds/datagrid/model/sourceFiles.ts';
import { chartExecutionCatalog } from '../src/playgrounds/charts/catalog.ts';
import { chartSourcePolicy } from '../src/playgrounds/charts/model/sourceFiles.ts';

const adapters = new Map([
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
    },
  ],
  [
    'charts',
    { catalog: chartExecutionCatalog, sourcePolicy: () => chartSourcePolicy, runtimeFiles: [] },
  ],
]);

export const knowledgePackageAdapters = completedPlaygroundPackages.map((entry) => {
  const adapter = adapters.get(entry.id);
  if (!adapter)
    throw new TypeError(`완료된 Playground의 Knowledge adapter가 없습니다: ${entry.id}`);
  return { ...entry, ...adapter };
});
