import { knowledgePackages } from '../src/playgrounds/packages.ts';
import { componentsCatalog } from '../src/playgrounds/components/catalog.ts';
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
      externalReexportPackages: ['@tanstack/react-query', 'i18next', 'react-i18next'],
      referenceOnlyPackages: ['@owp/components', '@owp/theme', '@owp/utils', '@owp/excel'],
      contractPackages: ['@owp/date-picker'],
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
      externalReexportPackages: [
        'chart.js',
        'react-chartjs-2',
        'chartjs-plugin-annotation',
        'chartjs-plugin-datalabels',
      ],
      referenceOnlyPackages: [],
      contractPackages: ['@owp/components', '@owp/utils'],
    },
  ],
]);

adapters.set('components', {
  manualCodeReviews: false,
  catalog: componentsCatalog,
  sourcePolicy: () => ({ core: [] }),
  runtimeFiles: [],
  referenceOnlyPackages: [],
  contractPackages: ['@owp/theme', '@owp/utils'],
  externalReexportPackages: ['@owp/theme'],
});
for (const id of ['date-picker', 'excel', 'pdf', 'theme', 'utils']) {
  adapters.set(id, {
    manualCodeReviews: false,
    catalog: [],
    sourcePolicy: () => ({ core: [] }),
    runtimeFiles: [],
    referenceOnlyPackages: [],
    contractPackages: id === 'date-picker' ? ['@owp/theme', '@owp/components'] : [],
    externalReexportPackages:
      id === 'pdf' ? ['@react-pdf/renderer'] : id === 'date-picker' ? ['dayjs'] : [],
  });
}

export const knowledgePackageAdapters = knowledgePackages.map((entry) => {
  const adapter = adapters.get(entry.id);
  if (!adapter)
    throw new TypeError(`완료된 Playground의 Knowledge adapter가 없습니다: ${entry.id}`);
  return { ...entry, ...adapter };
});
