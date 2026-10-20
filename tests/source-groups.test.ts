import { describe, expect, it } from 'vitest';
import { groupExampleSources } from '../src/features/code/source-groups';
import { getGridSourcePolicy } from '../src/playgrounds/datagrid/model/sourceFiles';
import { readSourceResources, sourceDependencyGraph } from '../scripts/source-resources';

describe('example source menu groups', () => {
  it('shows the selected task configuration, row types and styles without unrelated configurations', async () => {
    // Given
    const resources = await readSourceResources(new URL('..', import.meta.url).pathname);
    const directory = '/src/playgrounds/datagrid/';

    // When
    const groups = groupExampleSources({
      example: { package: '@owp/datagrid', source: 'examples/selection.tsx' },
      sources: [...resources.keys()],
      dependencies: sourceDependencyGraph(resources),
      policy: getGridSourcePolicy('selection'),
    });

    // Then
    expect(groups.core).toContain(`${directory}examples/configs/taskSelection.ts`);
    expect(groups.core).toContain(`${directory}examples/configs/taskList.tsx`);
    expect(groups.core).toContain(`${directory}types/index.ts`);
    expect(groups.core).not.toContain(`${directory}examples/configs/taskSave.ts`);
    expect(groups.core).not.toContain(`${directory}runtime/GridPreview.tsx`);
    expect(groups.support).toContain(`${directory}examples/styles.css`);
  });

  it('prioritizes only reachable core files and leaves supporting code selectable', () => {
    const directory = '/src/playgrounds/charts/';
    const entry = `${directory}examples/mixed.tsx`;
    const renderer = `${directory}runtime/ChartCanvas.tsx`;
    const data = `${directory}model/useNativeData.ts`;
    const unrelated = `${directory}model/useRadialData.ts`;
    const shell = '/src/app/App.tsx';
    const otherPackage = '/src/playgrounds/datagrid/examples/mixed.tsx';

    const groups = groupExampleSources({
      example: { package: '@owp/charts', source: 'examples/mixed.tsx' },
      sources: [entry, data, renderer, unrelated, shell, otherPackage],
      dependencies: { [entry]: [data], [data]: [renderer], [renderer]: [data, shell] },
      policy: {
        core: ['runtime/ChartCanvas.tsx', 'model/useNativeData.ts', 'model/useRadialData.ts'],
      },
    });

    expect(groups.core).toEqual([entry, renderer, data]);
    expect(groups.support).toEqual([shell, unrelated]);
  });

  it('follows only reachable feature directories without admitting sibling prefixes or preview code', () => {
    const directory = '/src/playgrounds/datagrid/';
    const entry = `${directory}examples/detail-grid.tsx`;
    const config = `${directory}examples/configs/nestedDetails.tsx`;
    const component = `${directory}examples/components/DetailGrid.tsx`;
    const types = `${directory}types/index.ts`;
    const unrelated = `${directory}examples/configs/taskSave.ts`;
    const sibling = `${directory}examples/configs-backup/old.ts`;
    const preview = `${directory}runtime/GridPreview.tsx`;

    const groups = groupExampleSources({
      example: { package: '@owp/datagrid', source: 'examples/detail-grid.tsx' },
      sources: [entry, config, component, types, unrelated, sibling, preview],
      dependencies: {
        [entry]: [config, types, sibling],
        [config]: [component],
        [component]: [types, preview],
      },
      policy: getGridSourcePolicy('detail-grid'),
    });

    expect(groups.core).toEqual([entry, config, component, types]);
    expect(groups.support).toEqual([unrelated, sibling, preview].sort());
  });

  it('includes grid runtime roots without following the registry into other examples', () => {
    const directory = '/src/playgrounds/datagrid/';
    const entry = `${directory}examples/editing.tsx`;
    const preview = `${directory}runtime/GridPreview.tsx`;
    const registry = `${directory}model/gridRegistry.ts`;
    const unrelated = `${directory}examples/server-mode.tsx`;
    const server = `${directory}model/server.ts`;

    const groups = groupExampleSources({
      example: { package: '@owp/datagrid', source: 'examples/editing.tsx' },
      sources: [entry, preview, registry, unrelated, server],
      dependencies: { [preview]: [registry], [registry]: [unrelated], [unrelated]: [server] },
      policy: {
        roots: ['runtime/GridPreview.tsx'],
        core: ['runtime/GridPreview.tsx', 'model/server.ts'],
      },
    });

    expect(groups.core).toEqual([entry, preview]);
    expect(groups.support).toContain(server);
    expect(groups.support).toContain(unrelated);
  });
});
