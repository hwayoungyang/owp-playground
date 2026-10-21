import { describe, expect, it } from 'vitest';
import { discoverExamplePropReferences } from '../scripts/api-example-props.mjs';

const source = (file, content, priority = 100) => ({
  file: `/src/playgrounds/${file}`,
  content,
  sha256: `hash:${file}`,
  priority,
});
const component = (name, props = `${name}Props`, packageId = 'charts') => ({
  id: `@owp/${packageId}:${name}`,
  package: `@owp/${packageId}`,
  name,
  owner: name,
  path: '',
  kind: 'component',
  imports: [`@owp/${packageId}`],
  related: [`@owp/${packageId}:${props}`],
});
const contracts = (name, keys, packageId = 'charts') => [
  {
    id: `@owp/${packageId}:${name}`,
    package: `@owp/${packageId}`,
    name,
    owner: name,
    path: '',
    kind: 'type',
    imports: [`@owp/${packageId}/types`],
  },
  ...keys.map((key) => ({
    id: `@owp/${packageId}:${name}.${key}`,
    package: `@owp/${packageId}`,
    owner: name,
    name: key,
    path: key,
    kind: key.startsWith('on') ? 'event' : 'property',
  })),
];
const records = (...entries) => new Map(entries.flat().map((record) => [record.id, record]));
const chartRecords = () =>
  records(
    component('ChartFrame'),
    contracts('ChartFrameProps', [
      'data',
      'options',
      'legend',
      'height',
      'preset',
      'datasetIdKey',
      'externalTooltip',
      'onClick',
    ]),
  );
const discover = (files, options = {}) =>
  discoverExamplePropReferences({
    packageId: 'charts',
    files,
    records: chartRecords(),
    ...options,
  });
const ids = (result) => result.references.map((reference) => reference.id);

describe('actual public component prop references', () => {
  it('binds aliases and namespaces while excluding same-name DOM props, strings and comments', () => {
    const file = source(
      'charts/examples/direct.tsx',
      `import { ChartFrame as Frame } from '@owp/charts';
import * as Charts from '@owp/charts';
// <Frame legend={{}} />
const text = '<Frame onClick={wrong} />';
const wrong = <div data="wrong" options={{}} />;
const one = <Frame data={rows} height="100%" aria-label="native" />;
const two = <Charts.ChartFrame options={{}} />;`,
    );
    const result = discover([file]);
    expect(ids(result)).toEqual([
      '@owp/charts:ChartFrameProps.data',
      '@owp/charts:ChartFrameProps.height',
      '@owp/charts:ChartFrameProps.options',
    ]);
    expect(result.references[0]).toMatchObject({
      label: 'data',
      packageId: 'charts',
      location: { file: 'playgrounds/charts/examples/direct.tsx', line: 6, sha256: file.sha256 },
      codeReview: { method: 'ast' },
    });
    expect(result.diagnostics).toContainEqual({
      kind: 'excluded-prop',
      component: 'ChartFrame',
      prop: 'aria-label',
      file: 'playgrounds/charts/examples/direct.tsx',
    });
  });

  it('expands local, imported and reexported actual object properties only at the spread receiver', () => {
    const files = [
      source(
        'charts/examples/spread.tsx',
        `import { ChartFrame } from '@owp/charts';
import { settings } from '../model/barrel';
const local = { ...settings, height: '100%' };
const { height, ...rest } = local;
const wrong = { legend: {} };
const view = <ChartFrame {...rest} />;`,
      ),
      source('charts/model/barrel.ts', `export { settings } from './settings';`, 0),
      source(
        'charts/model/settings.ts',
        `export const settings = {
  data: [],
  options: { onClick() {}, unknownNested: true },
};`,
        0,
      ),
    ];
    const result = discover(files);
    expect(ids(result)).toEqual([
      '@owp/charts:ChartFrameProps.data',
      '@owp/charts:ChartFrameProps.options',
    ]);
    expect(result.references[0].location).toMatchObject({
      file: 'playgrounds/charts/model/settings.ts',
      line: 2,
    });
  });

  it('follows hook return objects, nested frame objects and React memo aliases', () => {
    const files = [
      source(
        'charts/examples/hook.tsx',
        `import { ChartFrame } from '@owp/charts';
import { useCartesian, useArea } from '../model/hooks';
export function Example() {
  const chart = useCartesian();
  const radial = useArea();
  const { frame } = radial;
  return <><ChartFrame {...chart} /><ChartFrame {...frame} /></>;
}`,
      ),
      source(
        'charts/model/hooks.ts',
        `import { useMemo as memo } from 'react';
const defaults = { preset: 'owp', datasetIdKey: 'id' };
export function useCartesian() {
  return { ...defaults, data: [], options: {}, externalTooltip: true };
}
export const useArea = () => memo(() => ({
  frame: { legend: {}, height: '100%' }, options: { onClick() {} },
}), []);`,
        0,
      ),
    ];
    const result = discover(files);
    expect(ids(result)).toEqual(
      ['data', 'datasetIdKey', 'externalTooltip', 'height', 'legend', 'options', 'preset'].map(
        (key) => `@owp/charts:ChartFrameProps.${key}`,
      ),
    );
    expect(
      result.references.find((reference) => reference.label === 'legend')?.location,
    ).toMatchObject({ file: 'playgrounds/charts/model/hooks.ts', line: 7 });
    expect(ids(result)).not.toContain('@owp/charts:ChartFrameProps.onClick');
  });

  it('resolves local import/export barrels without treating component-looking locals as public', () => {
    const result = discover([
      source(
        'charts/examples/barrel.tsx',
        `import { Frame } from '../model/barrel';
const local = () => null;
const view = <><Frame data={[]} /><local options={{}} /></>;`,
      ),
      source(
        'charts/model/barrel.ts',
        `import { ChartFrame as Frame } from '@owp/charts'; export { Frame };`,
        0,
      ),
    ]);
    expect(ids(result)).toEqual(['@owp/charts:ChartFrameProps.data']);
  });

  it('retains known keys from partial spreads and reports the unsupported remainder', () => {
    const result = discover([
      source(
        'charts/examples/partial.tsx',
        `import { ChartFrame } from '@owp/charts';
function Example(props: unknown) {
  const config = { ...props, data: [] };
  return <><ChartFrame {...config} /><ChartFrame {...{}} /></>;
}`,
      ),
    ]);
    expect(ids(result)).toEqual(['@owp/charts:ChartFrameProps.data']);
    expect(result.diagnostics.filter((entry) => entry.kind === 'unresolved-spread')).toEqual([
      {
        kind: 'unresolved-spread',
        component: 'ChartFrame',
        file: 'playgrounds/charts/examples/partial.tsx',
        line: 4,
      },
    ]);
  });

  it('does not invent keys from broad types, unknown calls, mutable values or shadowed components', () => {
    const result = discover([
      source(
        'charts/examples/unknown.tsx',
        `import { ChartFrame } from '@owp/charts';
import type { ChartFrameProps } from '@owp/charts/types';
declare const typed: ChartFrameProps;
const unknown = external();
let mutable = { data: [] };
function Shadow(ChartFrame: unknown) { return <ChartFrame legend={{}} />; }
function Example(props: ChartFrameProps) {
  return <><ChartFrame {...typed} {...props} {...unknown} {...mutable} /><div options={{}} /></>;
}`,
      ),
    ]);
    expect(result.references).toEqual([]);
    expect(result.diagnostics.filter((entry) => entry.kind === 'unresolved-spread')).toHaveLength(
      4,
    );
  });

  it('keeps distinct component owners and inherited contract members', () => {
    const result = discover(
      [
        source(
          'charts/examples/owners.tsx',
          `import { ChartFrame, OwpAreaChart } from '@owp/charts';
const view = <><ChartFrame height={400} /><OwpAreaChart height={300} /></>;`,
        ),
      ],
      {
        records: records(
          component('ChartFrame'),
          component('OwpAreaChart'),
          contracts('ChartFrameProps', ['height']),
          contracts('OwpAreaChartProps', ['height']).map((record) => ({
            ...record,
            declaredIn: '@owp/charts:ChartFrameBaseProps.height',
          })),
        ),
      },
    );
    expect(ids(result)).toEqual([
      '@owp/charts:ChartFrameProps.height',
      '@owp/charts:OwpAreaChartProps.height',
    ]);
    expect(result.references.map((reference) => reference.label)).toEqual(['height', 'height']);
  });

  it('discovers DataGrid props in Charts examples while preserving the Charts source location', () => {
    const file = source(
      'charts/examples/sparkline.tsx',
      `import { ChartFrame } from '@owp/charts';
import { OwpDataGrid as Grid } from '@owp/datagrid';
const view = <Grid rows={rows} columns={columns} getRowId={getId} visibleRowCount={6} rowSelectionMode="none"
  detailPanel={{ renderDetail: () => <ChartFrame data={[]} /> }} ref={gridRef} />;`,
    );
    const result = discover([file], {
      records: records(
        ...chartRecords().values(),
        component('OwpDataGrid', 'OwpDataGridProps', 'datagrid'),
        contracts(
          'OwpDataGridProps',
          ['rows', 'columns', 'getRowId', 'visibleRowCount', 'rowSelectionMode', 'detailPanel'],
          'datagrid',
        ),
        contracts('OwpDataGridRef', [], 'datagrid'),
      ),
    });
    expect(ids(result)).toEqual([
      '@owp/charts:ChartFrameProps.data',
      '@owp/datagrid:OwpDataGridProps.columns',
      '@owp/datagrid:OwpDataGridProps.detailPanel',
      '@owp/datagrid:OwpDataGridProps.getRowId',
      '@owp/datagrid:OwpDataGridProps.rows',
      '@owp/datagrid:OwpDataGridProps.rowSelectionMode',
      '@owp/datagrid:OwpDataGridProps.visibleRowCount',
      '@owp/datagrid:OwpDataGridRef',
    ]);
    for (const reference of result.references.filter((entry) =>
      entry.id.startsWith('@owp/datagrid:'),
    )) {
      expect(reference).toMatchObject({
        packageId: 'datagrid',
        location: {
          file: 'playgrounds/charts/examples/sparkline.tsx',
          sha256: file.sha256,
        },
      });
    }
    expect(
      result.references.find((reference) => reference.id === '@owp/charts:ChartFrameProps.data')
        ?.packageId,
    ).toBe('charts');
  });

  it('resolves same-name components and contracts by import source without adding unsupported native props', () => {
    const result = discover(
      [
        source(
          'charts/examples/collisions.tsx',
          `import { Shared as ChartShared } from '@owp/charts';
import { Shared as GridShared } from '@owp/datagrid';
import { Shared as Unrelated } from '@owp/components';
function Shadow(GridShared: unknown) { return <GridShared chartOnly={true} />; }
const view = <><ChartShared shared={1} chartOnly={true} gridOnly={true} aria-label="native" />
  <GridShared shared={2} gridOnly={true} chartOnly={true} disabled variant="text" startIcon={icon} />
  <Unrelated shared={3} chartOnly={true} gridOnly={true} /></>;`,
        ),
      ],
      {
        records: records(
          component('Shared', 'SharedProps', 'charts'),
          contracts('SharedProps', ['shared', 'chartOnly'], 'charts'),
          component('Shared', 'SharedProps', 'datagrid'),
          contracts('SharedProps', ['shared', 'gridOnly'], 'datagrid'),
          component('Shared', 'SharedProps', 'components'),
          contracts('SharedProps', ['shared', 'chartOnly', 'gridOnly'], 'components'),
        ),
      },
    );
    expect(ids(result)).toEqual([
      '@owp/charts:SharedProps.chartOnly',
      '@owp/charts:SharedProps.shared',
      '@owp/datagrid:SharedProps.gridOnly',
      '@owp/datagrid:SharedProps.shared',
    ]);
    expect(result.references.map((reference) => reference.packageId)).toEqual([
      'charts',
      'charts',
      'datagrid',
      'datagrid',
    ]);
    expect(
      result.references.find((reference) => reference.id === '@owp/datagrid:SharedProps.gridOnly')
        ?.location.line,
    ).toBe(6);
    expect(
      result.diagnostics
        .filter((entry) => entry.kind === 'excluded-prop')
        .map((entry) => entry.prop),
    ).toEqual(['gridOnly', 'aria-label', 'chartOnly', 'disabled', 'variant', 'startIcon']);
  });

  it('maps the registered GridView runtime attributes and current configuration to the public grid contract', () => {
    const result = discover(
      [
        source(
          'datagrid/examples/grid.tsx',
          `import { OwpDataGrid } from '@owp/datagrid';
export { actual as gridConfiguration } from './config';
export function Example(props: unknown) { return <OwpDataGrid {...props} />; }`,
        ),
        source(
          'datagrid/examples/config.ts',
          `export const actual = { rows: [], getRowId: row => row.id };`,
          60,
        ),
        source(
          'datagrid/runtime/GridPreview.tsx',
          `import { gridRegistry } from '../model/gridRegistry';
export function GridPreview({ example, controller }) {
  const GridView = gridRegistry[example.id].Component;
  return <GridView {...controller.configuration} api={controller.api} columns={[]} loading={false} onRowsChange={record} onCellClick={record} />;
}`,
          0,
        ),
      ],
      {
        packageId: 'datagrid',
        records: records(
          component('OwpDataGrid', 'OwpDataGridProps', 'datagrid'),
          contracts(
            'OwpDataGridProps',
            ['rows', 'getRowId', 'api', 'columns', 'loading', 'onCellClick'],
            'datagrid',
          ),
        ),
      },
    );
    expect(ids(result)).toEqual(
      ['api', 'columns', 'getRowId', 'loading', 'onCellClick', 'rows'].map(
        (key) => `@owp/datagrid:OwpDataGridProps.${key}`,
      ),
    );
    expect(result.references.find((reference) => reference.label === 'rows')?.location.file).toBe(
      'playgrounds/datagrid/examples/config.ts',
    );
    expect(result.diagnostics).toContainEqual({
      kind: 'excluded-prop',
      component: 'OwpDataGrid',
      prop: 'onRowsChange',
      file: 'playgrounds/datagrid/runtime/GridPreview.tsx',
    });
  });

  it('requires the exact registered runtime adapter and a publicly exported ref contract', () => {
    const result = discover(
      [
        source(
          'datagrid/examples/grid.tsx',
          `import { OwpDataGrid } from '@owp/datagrid';
const GridView = otherRegistry[id].Component;
const view = <><GridView rows={[]} /><OwpDataGrid ref={gridRef} /></>;`,
        ),
      ],
      {
        packageId: 'datagrid',
        records: records(
          component('OwpDataGrid', 'OwpDataGridProps', 'datagrid'),
          contracts('OwpDataGridProps', ['rows'], 'datagrid'),
          contracts('OwpDataGridRef', [], 'datagrid'),
        ),
      },
    );
    expect(ids(result)).toEqual(['@owp/datagrid:OwpDataGridRef']);
    expect(result.references[0]).toMatchObject({ label: 'ref', location: { line: 3 } });
  });

  it('chooses the highest-priority source and terminates unsupported cyclic spreads', () => {
    const result = discover([
      source(
        'charts/runtime/ChartCanvas.tsx',
        `import { ChartFrame } from '@owp/charts'; const view = <ChartFrame data={rows} />;`,
        0,
      ),
      source(
        'charts/examples/entry.tsx',
        `import { ChartFrame } from '@owp/charts';
const a = { ...b }; const b = { ...a }; const cyclic = cyclic.frame;
const view = <ChartFrame data={[]} {...a} {...cyclic} />;`,
      ),
    ]);
    expect(ids(result)).toEqual(['@owp/charts:ChartFrameProps.data']);
    expect(result.references[0].location.file).toBe('playgrounds/charts/examples/entry.tsx');
  });
});
