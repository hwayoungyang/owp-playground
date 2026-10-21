import { expect, it } from 'vitest';
import { locateExampleCode } from '../scripts/api-example-locations.mjs';

const file = (content) => [
  {
    file: '/src/playgrounds/datagrid/examples/test.tsx',
    content,
    sha256: 'fixture',
    priority: 100,
  },
];
it('finds actual method calls rather than comments or action-name strings', () => {
  const content =
    '// setCellValue\nconst action = "setCellValue";\ngrid.setCellValue(\n  "row", "column", 42,\n);';
  expect(
    locateExampleCode(
      { path: 'setCellValue', name: 'setCellValue', owner: 'OwpDataGridApi', kind: 'method' },
      'setCellValue',
      file(content),
    ),
  ).toMatchObject({ line: 3, endLine: 5 });
  expect(
    locateExampleCode(
      { path: 'setCellValue', kind: 'method', owner: 'OwpDataGridApi' },
      'setCellValue',
      file('// setCellValue\nconst action = "setCellValue";'),
    ),
  ).toBeNull();
});
it('prefers a matching qualified configuration and component prop', () => {
  const content =
    'const wrong = { multiple: false };\nconst cfg = { selectOptions: { multiple: true } };';
  expect(
    locateExampleCode(
      { path: 'multiple', owner: 'OwpDataGridSelectOptions', kind: 'property' },
      'selectOptions.multiple',
      file(content),
    )?.line,
  ).toBe(2);
  const jsx =
    'const wrong = <input type="text" />;\nconst right = <OwpDataGrid rowSelectionMode="single" type="custom" />;';
  expect(
    locateExampleCode(
      { path: 'type', owner: 'OwpDataGridProps', kind: 'property' },
      'type',
      file(jsx),
    )?.line,
  ).toBe(2);
  expect(
    locateExampleCode(
      { path: 'type', owner: 'OwpDataGridColumn', kind: 'property' },
      'type',
      file(jsx),
    ),
  ).toBeNull();
});
it('resolves imported utility aliases and option-object type labels', () => {
  const content =
    'import { createRows as buildRows } from "@owp/datagrid/utils";\nconst rows = buildRows([]);';
  expect(
    locateExampleCode(
      {
        path: '',
        package: '@owp/datagrid',
        name: 'createRows',
        owner: 'createRows',
        kind: 'function',
      },
      'createRows',
      file(content),
    )?.line,
  ).toBe(2);
  expect(
    locateExampleCode(
      {
        path: '',
        name: 'ChartDataLabelsPluginOptions',
        owner: 'ChartDataLabelsPluginOptions',
        kind: 'type',
      },
      'plugins.datalabels',
      file('const options = { plugins: { datalabels: { color: "red" } } };'),
    )?.line,
  ).toBe(1);
});

it('requires the qualified method receiver, including optional chains', () => {
  const content =
    'instance.setActiveElements(elements);\ninstance.tooltip?.setActiveElements(elements, {\n  x: 10, y: 20,\n});';
  const record = {
    path: 'setActiveElements',
    name: 'setActiveElements',
    owner: 'TooltipModel',
    kind: 'method',
  };
  expect(locateExampleCode(record, 'tooltip.setActiveElements', file(content))).toMatchObject({
    line: 2,
    endLine: 4,
  });
  expect(
    locateExampleCode(
      record,
      'tooltip.setActiveElements',
      file('instance.setActiveElements(elements);'),
    ),
  ).toBeNull();
});

it('requires the JSX configuration path rather than a same-name nested property', () => {
  const content =
    'const options = { scales: { x: { min: 0 } } };\nconst chart = <ChartFrame zoomSlider={{ x: true }} />;';
  const record = { path: 'x', name: 'x', owner: 'ChartZoomSliderOptions', kind: 'property' };
  expect(locateExampleCode(record, 'zoomSlider.x', file(content))?.line).toBe(2);
  expect(
    locateExampleCode(record, 'zoomSlider.x', file('const options = { scales: { x: {} } };')),
  ).toBeNull();
  expect(
    locateExampleCode(
      { path: 'onClick', owner: 'ChartLegendOptions', kind: 'property' },
      'legend.onClick',
      file(
        'const options = { onClick() {} };\nconst chart = <ChartFrame legend={{ onClick: callback }} />;',
      ),
    )?.line,
  ).toBe(2);
});

it('excludes destructuring and follows variables passed as JSX data', () => {
  const content =
    'const { data } = useData();\nconst chartData = { datasets: data.datasets.map(dataset => ({\n  ...dataset, data: [1, 2],\n})) };\nconst chart = <ChartCanvas data={chartData} />;';
  const record = { path: 'data', name: 'data', owner: 'ChartDatasetProperties', kind: 'property' };
  expect(locateExampleCode(record, 'data.datasets.data', file(content))?.line).toBe(3);
  expect(locateExampleCode(record, 'data', file('const { data } = useData();'))).toBeNull();
});

it('keeps intermediate axis IDs while requiring the entire qualified path in order', () => {
  const record = { path: 'ticks.stepSize', owner: 'LinearScaleOptions', kind: 'property' };
  expect(
    locateExampleCode(
      record,
      'scales.ticks.stepSize',
      file('const options = { scales: { x: { ticks: { stepSize: 5 } } } };'),
    )?.line,
  ).toBe(1);
  expect(
    locateExampleCode(
      record,
      'scales.ticks.stepSize',
      file('const options = { scales: { stepSize: 5 }, ticks: {} };'),
    ),
  ).toBeNull();
});

it('requires the property owner instead of transaction, DOM or utility names', () => {
  const column = {
    path: 'type',
    name: 'type',
    owner: 'OwpDataGridColumn',
    kind: 'property',
    typeDetails: { valueKind: 'exact', values: ['"select"', '"text"'] },
  };
  const content =
    'const actions = [{ type: "setCellValue" }];\nconst columns = [\n  { type: "select" },\n] satisfies OwpDataGridColumn<Row>[];';
  expect(locateExampleCode(column, 'type', file(content))?.line).toBe(3);
  expect(
    locateExampleCode(column, 'type', file('const actions = [{ type: "setCellValue" }];')),
  ).toBeNull();
  expect(
    locateExampleCode(
      column,
      'type',
      file('const column: OwpDataGridColumn<Row> = { type: "setCellValue" };'),
    ),
  ).toBeNull();
  expect(
    locateExampleCode(
      { path: 'style', owner: 'OwpDataGridProps', kind: 'property' },
      'style',
      file('host.style.height = "420px";'),
    ),
  ).toBeNull();
  expect(
    locateExampleCode(
      { path: 'data', owner: 'ChartFrameProps', kind: 'property' },
      'data',
      file('createChartData({ data: source });'),
    ),
  ).toBeNull();
});

it('accepts typed config aliases and component spreads without inheriting nested object owners', () => {
  const record = {
    path: 'style',
    owner: 'OwpDataGridProps',
    package: '@owp/datagrid',
    kind: 'property',
  };
  expect(
    locateExampleCode(
      record,
      'style',
      file(
        'import type { OwpDataGridProps as GridProps } from "@owp/datagrid/types";\nconst config: GridProps = { style: {} };',
      ),
    )?.line,
  ).toBe(2);
  expect(
    locateExampleCode(record, 'style', file('const grid = <OwpDataGrid {...{ style: {} }} />;'))
      ?.line,
  ).toBe(1);
  expect(
    locateExampleCode(
      record,
      'style',
      file('const config: OwpDataGridProps = { columns: [{ style: {} }] };'),
    ),
  ).toBeNull();
});

it.each([
  'const local: { style: string } = { style: "local" };',
  'const local: { style: string; grid?: OwpDataGridProps } = { style: "local" };',
  'const local: OwpDataGridProps["other"] = { style: "local" };',
  'function build(): OwpDataGridProps { const unrelated = { style: "local" }; return {} as OwpDataGridProps; }',
  'import { useMemo } from "react"; const config = useMemo<OwpDataGridProps>(() => { const unrelated = { style: "local" }; return actual; }, []);',
  'function build(): OwpDataGridProps { log({ style: "local" }); return actual; }',
  'function build(): OwpDataGridProps { ({ style: "local" }); return actual; }',
  'const unrelated = otherFunction<OwpDataGridProps>({ style: "local" });',
])(
  'does not inherit an owner from unrelated type declarations or outer functions: %s',
  (content) => {
    expect(
      locateExampleCode(
        { path: 'style', owner: 'OwpDataGridProps', kind: 'property' },
        'style',
        file(content),
      ),
    ).toBeNull();
  },
);

it.each([
  'function build(): OwpDataGridProps { return { style: {} }; }',
  'import { useMemo } from "react"; const config = useMemo<OwpDataGridProps>(() => ({ style: {} }), []);',
  'import { useMemo as memo } from "react"; const config = memo<OwpDataGridProps>(() => { return { style: {} }; }, []);',
  'import React from "react"; const config = React.useMemo<OwpDataGridProps>(() => ({ style: {} }), []);',
  'const config: Readonly<Partial<OwpDataGridProps>> = { style: {} };',
])('connects directly returned or initialized owner objects: %s', (content) => {
  expect(
    locateExampleCode(
      { path: 'style', owner: 'OwpDataGridProps', kind: 'property' },
      'style',
      file(content),
    )?.line,
  ).toBe(1);
});
