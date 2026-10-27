import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'vitest';
import { readDeclarations } from '../scripts/api-declarations.mjs';
import { inheritApiMembers } from '../scripts/api-inheritance.mjs';
import { resolveExampleReferences } from '../scripts/api-references.mjs';
import { chartExecutionCatalog } from '../src/playgrounds/charts/catalog.ts';
import { gridCatalog } from '../src/playgrounds/datagrid/catalog.ts';

const root = path.resolve(import.meta.dirname, '..');
const record = (id, related = []) => ({
  id,
  related,
  package: id.split(':')[0],
  name: id.split('.').at(-1),
  path: id.split(':')[1],
});
function resolve(
  records,
  { packageId = 'datagrid', id = 'fixture', label = 'value', component = 'OwpDataGrid' } = {},
) {
  return resolveExampleReferences({
    packageId,
    records,
    examples: [{ id, api: [label] }],
    sourceText: new Map([[id, `<${component} />`]]),
  })[0].references[0];
}

test('일반 명시 규칙은 컴포넌트의 관련 타입보다 우선한다', () => {
  const target = '@owp/datagrid:OwpDataGridExcelSnapshotOptions.scope';
  assert.equal(
    resolve(
      [
        record('@owp/datagrid:OwpDataGridProps', ['@owp/datagrid:SummaryRow']),
        record('@owp/datagrid:SummaryRow'),
        record('@owp/datagrid:SummaryRow.scope'),
        record(target),
      ],
      { label: 'scope' },
    ).id,
    target,
  );
});

test('컴포넌트의 직접 속성은 일반 명시 규칙보다 우선한다', () => {
  for (const label of ['data', 'type']) {
    const target = `@owp/charts:ChartFrameProps.${label}`;
    assert.equal(
      resolve(
        [
          record('@owp/charts:ChartFrameProps'),
          record(target),
          record('chart.js:ChartConfiguration.data'),
          record('@owp/charts:ChartSeriesConfig.type'),
        ],
        { packageId: 'charts', component: 'ChartFrame', label },
      ).id,
      target,
    );
  }
});

test('예제별 qualified ID는 직접 속성보다 우선하며 패키지를 보존한다', () => {
  const target = 'chart.js:CoreChartOptions.animation';
  assert.deepEqual(
    resolve(
      [
        record('@owp/charts:CoreChartProps'),
        record('@owp/charts:CoreChartProps.animation'),
        record(target),
      ],
      { packageId: 'charts', id: 'sparkline', component: 'CoreChart', label: 'animation' },
    ),
    {
      label: 'animation',
      id: target,
      packageId: 'charts',
    },
  );
});

test('예제별 대상이 누락되면 같은 이름의 다른 선언으로 대체하지 않는다', () => {
  assert.throws(
    () =>
      resolve(
        [
          record('@owp/charts:ChartFrameProps'),
          record('@owp/charts:ChartFrameProps.line'),
          record('@owp/charts:ChartSeriesConfig.type'),
        ],
        { packageId: 'charts', id: 'target-line', component: 'ChartFrame', label: 'line' },
      ),
    /chartjs-plugin-annotation:LineAnnotationOptions/,
  );
});

test('명시적 qualified ID는 label 의미를 유지하고 예정된 패키지 대신 현재 조회 문맥을 보존한다', () => {
  assert.deepEqual(
    resolve(
      [
        record('@owp/components:OwpLoading', ['@owp/components:OwpLoadingProps']),
        record('@owp/components:OwpLoadingProps'),
      ],
      {
        packageId: 'core',
        id: 'loading',
        component: 'OwpLoading',
        label: '@owp/components:OwpLoading',
      },
    ),
    {
      label: 'OwpLoading',
      id: '@owp/components:OwpLoading',
      packageId: 'core',
    },
  );
});

test('비자격 Core API는 동명 Components 선언으로 오인하지 않으며 누락된 qualified ID는 즉시 거부한다', () => {
  assert.deepEqual(
    resolve([record('@owp/core:OwpDialog'), record('@owp/components:OwpDialog')], {
      packageId: 'core',
      id: 'dialog',
      component: 'OwpDialog',
      label: 'OwpDialog',
    }),
    {
      label: 'OwpDialog',
      id: '@owp/core:OwpDialog',
      packageId: 'core',
    },
  );
  assert.throws(
    () =>
      resolve([record('@owp/components:OwpLoading')], {
        packageId: 'core',
        id: 'loading',
        component: 'OwpLoading',
        label: 'OwpLoading',
      }),
    /core\/loading\/OwpLoading/,
  );
  assert.throws(
    () =>
      resolve([record('@owp/core:OwpLoading')], {
        packageId: 'core',
        id: 'loading',
        component: 'OwpLoading',
        label: '@owp/components:OwpLoading',
      }),
    /@owp\/components:OwpLoading/,
  );
});

test('관련 타입의 동명 후보는 순서와 관계없이 모호성 오류를 낸다', () => {
  for (const related of [
    ['First', 'Second'],
    ['Second', 'First'],
  ]) {
    assert.throws(
      () =>
        resolve([
          record(
            '@owp/datagrid:OwpDataGridProps',
            related.map((name) => `@owp/datagrid:${name}`),
          ),
          ...related.flatMap((name) => [
            record(`@owp/datagrid:${name}`),
            record(`@owp/datagrid:${name}.value`),
          ]),
        ]),
      (error) =>
        error instanceof ReferenceError &&
        /모호/.test(error.message) &&
        /First.value/.test(error.message) &&
        /Second.value/.test(error.message),
    );
  }
});

test('서로 다른 기본 탐색 루트의 동명 후보도 모호성 오류를 낸다', () => {
  assert.throws(
    () =>
      resolve([
        record('@owp/datagrid:OwpDataGridColumn'),
        record('@owp/datagrid:OwpDataGridColumn.value'),
        record('@owp/datagrid:OwpDataGridApi'),
        record('@owp/datagrid:OwpDataGridApi.value'),
      ]),
    /모호/,
  );
});

test('ref-data의 getRows 지정은 다른 예제의 동명 후보를 덮어쓰지 않는다', () => {
  assert.throws(
    () =>
      resolve(
        [
          record('@owp/datagrid:OwpDataGridProps', ['@owp/datagrid:OwpDataGridDetailPanelOptions']),
          record('@owp/datagrid:OwpDataGridDetailPanelOptions'),
          record('@owp/datagrid:OwpDataGridDetailPanelOptions.getRows'),
          record('@owp/datagrid:OwpDataGridApi'),
          record('@owp/datagrid:OwpDataGridApi.getRows'),
        ],
        { label: 'getRows' },
      ),
    /모호/,
  );
});

test('Hook·Ref 연결 예제의 공통 메서드는 Grid API 선언으로 연결한다', () => {
  for (const id of ['hook-connection', 'ref-connection']) {
    for (const label of ['getRows', 'focusCell']) {
      const target = `@owp/datagrid:OwpDataGridApi.${label}`;
      assert.equal(
        resolve(
          [
            record('@owp/datagrid:OwpDataGridProps', ['@owp/datagrid:OtherApi']),
            record('@owp/datagrid:OtherApi'),
            record(`@owp/datagrid:OtherApi.${label}`),
            record('@owp/datagrid:OwpDataGridApi'),
            record(target),
          ],
          { id, label },
        ).id,
        target,
      );
    }
  }
});

test('순환·다이아몬드 참조에서 동일한 선언은 하나의 후보로 처리한다', () => {
  const target = '@owp/datagrid:Shared.value';
  assert.equal(
    resolve([
      record('@owp/datagrid:OwpDataGridProps', ['@owp/datagrid:First', '@owp/datagrid:Second']),
      record('@owp/datagrid:First', ['@owp/datagrid:Shared']),
      record('@owp/datagrid:Second', ['@owp/datagrid:Shared']),
      record('@owp/datagrid:Shared', ['@owp/datagrid:OwpDataGridProps']),
      record(target),
    ]).id,
    target,
  );
});

test('직접 지정한 중첩 경로는 해당 속성의 타입을 따라간다', () => {
  const target = '@owp/datagrid:SelectOptions.multiple';
  assert.equal(
    resolve(
      [
        record('@owp/datagrid:OwpDataGridProps', ['@owp/datagrid:Other']),
        record('@owp/datagrid:OwpDataGridProps.selectOptions', ['@owp/datagrid:SelectOptions']),
        record('@owp/datagrid:SelectOptions'),
        record(target),
        record('@owp/datagrid:Other'),
        record('@owp/datagrid:Other.multiple'),
      ],
      { label: 'selectOptions.multiple' },
    ).id,
    target,
  );
});

test('이름으로만 찾은 여러 후보와 선언 누락을 오류로 보고한다', () => {
  assert.throws(
    () => resolve([record('@owp/datagrid:First.value'), record('@owp/datagrid:Second.value')]),
    /모호/,
  );
  assert.throws(() => resolve([]), /datagrid\/fixture\/value/);
});

const catalogs = { datagrid: gridCatalog, charts: chartExecutionCatalog };
const sources = Object.fromEntries(
  await Promise.all(
    Object.entries(catalogs).map(async ([packageId, examples]) => [
      packageId,
      new Map(
        await Promise.all(
          examples.map(async (example) => [
            example.id,
            await readFile(
              path.join(root, `src/playgrounds/${packageId}/${example.source}`),
              'utf8',
            ),
          ]),
        ),
      ),
    ]),
  ),
);
const require = createRequire(
  await realpath(path.join(root, 'node_modules/@owp/charts/package.json')),
);
const externalPackages = [
  'chart.js',
  'react-chartjs-2',
  'chartjs-plugin-annotation',
  'chartjs-plugin-datalabels',
];
const declarations = await Promise.all([
  ...['datagrid', 'charts'].map((packageId) =>
    readDeclarations(path.join(root, `node_modules/@owp/${packageId}`), { externalPackages }),
  ),
  ...externalPackages.map((name) =>
    readDeclarations(path.resolve(require.resolve(name), '../..'), {
      externalPackages,
      additionalEntries:
        name === 'chartjs-plugin-datalabels'
          ? { './types/options': { types: './types/options.d.ts' } }
          : {},
    }),
  ),
]);
const records = inheritApiMembers(declarations.flatMap((declaration) => declaration.records));
const generated = JSON.parse(
  await readFile(path.join(root, 'src/features/api/data/knowledge.generated.json'), 'utf8'),
);
const regressions = [
  ['datagrid', 'ref-data', 'getRows', '@owp/datagrid:OwpDataGridApi.getRows'],
  [
    'datagrid',
    'detail-grid',
    'scope',
    '@owp/datagrid:OwpDataGridExcelSnapshotOptions.scope',
    '@owp/datagrid:OwpDataGridExportExcelButtonApiProps.scope',
  ],
  ['charts', 'drag-zoom', 'mode', '@owp/charts:ChartDragZoomOptions.mode'],
  ['charts', 'target-line', 'line', 'chartjs-plugin-annotation:LineAnnotationOptions'],
  ['charts', 'sparkline', 'animation', 'chart.js:CoreChartOptions.animation'],
  ['charts', 'box-plot', 'BoxPlotDatasetOptions', '@owp/charts:BoxPlotDatasetOptions'],
  ['charts', 'box-plot', 'type', '@owp/charts:ChartFrameProps.type'],
  ['charts', 'treemap', 'type', '@owp/charts:ChartFrameProps.type'],
  ['charts', 'treemap', 'style', '@owp/charts:OwpTreemapChartProps.style'],
  ['charts', 'heatmap', 'type', '@owp/charts:ChartFrameProps.type'],
  ['charts', 'heatmap', 'domain', '@owp/charts:OwpHeatmapChartProps.domain'],
  ['datagrid', 'context-menu', 'getRows', '@owp/datagrid:OwpDataGridApi.getRows'],
  [
    'datagrid',
    'ref-changes',
    'onAfterReset',
    '@owp/datagrid:OwpDataGridResetChangesButtonApiProps.onAfterReset',
  ],
];

for (const [packageId, id, label, target, reviewedTarget = target] of regressions) {
  test(`선언 탐색 후보 ${packageId}/${id}/${label}은 ${target}을 가리킨다`, () => {
    const example = catalogs[packageId].find((entry) => entry.id === id);
    assert.ok(example.api.includes(label));
    assert.ok(
      records.some((entry) => entry.id === target),
      `설치된 공개 선언 누락: ${target}`,
    );
    const [result] = resolveExampleReferences({
      packageId,
      examples: [example],
      records,
      sourceText: sources[packageId],
    });
    assert.equal(result.references.find((entry) => entry.label === label)?.id, target);
  });

  test(`통합 생성 데이터 ${packageId}/${id}/${label}`, () => {
    assert.ok(
      generated.records.some((entry) => entry.id === reviewedTarget),
      `생성 데이터 선언 누락: ${reviewedTarget}`,
    );
    assert.equal(
      generated.examples
        .find((entry) => entry.packageId === packageId && entry.id === id)
        ?.references.find((entry) => entry.label === label)?.id,
      reviewedTarget,
    );
  });
}

test('전체 카탈로그의 API 라벨을 모호함 없이 해석한다', () => {
  const errors = [];
  let count = 0;
  for (const [packageId, examples] of Object.entries(catalogs)) {
    for (const example of examples) {
      for (const label of example.api) {
        const resolvedLabel = label.includes(':') ? label.slice(label.indexOf(':') + 1) : label;
        count += 1;
        try {
          const [result] = resolveExampleReferences({
            packageId,
            examples: [{ ...example, api: [label] }],
            records,
            sourceText: sources[packageId],
          });
          if (
            !regressions.some(
              ([pkg, id, name]) => pkg === packageId && id === example.id && name === label,
            )
          ) {
            const published = generated.examples.find(
              (entry) => entry.packageId === packageId && entry.id === example.id,
            );
            const decision = published?.referenceReviews.find(
              (entry) => entry.label === resolvedLabel,
            );
            const previous = published?.references.find((entry) => entry.label === resolvedLabel);
            assert.equal(
              result.references[0].id,
              decision?.id ?? previous?.id,
              `${packageId}/${example.id}/${label}`,
            );
          }
        } catch (error) {
          errors.push(error.message);
        }
      }
    }
  }
  assert.equal(
    count,
    Object.values(catalogs)
      .flat()
      .reduce((sum, example) => sum + example.api.length, 0),
  );
  assert.deepEqual(errors, []);
});
