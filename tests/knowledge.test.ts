import { describe, expect, it } from 'vitest';
import { knowledgeAssets } from '../scripts/knowledge-resources';
import data from '../src/features/api/data/knowledge.generated.json';
import { knowledge, packageRecords, recordsById } from './fixtures/api-knowledge';
import { apiHref, exampleApiLinks } from '../src/features/api/model/links';
import { matchesApiQuery } from '../src/features/api/model/search';
import {
  ApiKnowledgeLoadError,
  createApiKnowledgeLoader,
} from '../src/features/api/model/knowledge';
import { createPackageKnowledge } from '../src/features/api/model/package-data';
import { packageKnowledgeSchema } from '../src/features/api/model/schema';
import { createPlaygroundUrl, readPlaygroundRoute } from '../src/playgrounds/registry';

describe('API documentation navigation', () => {
  it('round-trips qualified symbols without keeping the previous sample', () => {
    const symbol = '@owp/charts:ChartLegendOptions.mode';
    const route = readPlaygroundRoute(apiHref('charts', symbol));
    expect(route).toMatchObject({ status: 'api', symbol, playground: { id: 'charts' } });
    const url = createPlaygroundUrl(
      'https://example.test/?package=datagrid&sample=editing&ref=team',
      route,
    );
    expect(url.searchParams.has('sample')).toBe(false);
    expect(url.searchParams.get('ref')).toBe('team');
    expect(readPlaygroundRoute(url.search)).toEqual(route);
    const back = createPlaygroundUrl(
      url.href,
      readPlaygroundRoute('?package=datagrid&sample=editing'),
    );
    expect(back.searchParams.has('view')).toBe(false);
    expect(back.searchParams.has('symbol')).toBe(false);
  });

  it('keeps native and OWP axis names, nested options and cross-package references distinct', () => {
    expect(
      exampleApiLinks('charts', 'axis-stacks').find((reference) => reference.label === 'yAxisID')
        ?.id,
    ).toBe('chart.js:LineControllerDatasetOptions.yAxisID');
    expect(
      exampleApiLinks('datagrid', 'select').find(
        (reference) => reference.label === 'selectOptions.multiple',
      )?.id,
    ).toBe('@owp/datagrid:OwpDataGridSelectOptions.multiple');
    expect(
      exampleApiLinks('charts', 'detail-chart').find(
        (reference) => reference.label === 'detailPanel.renderDetail',
      ),
    ).toMatchObject({
      packageId: 'datagrid',
      id: '@owp/datagrid:OwpDataGridDetailPanelOptions.renderDetail',
    });
  });
});

describe('package API loading', () => {
  const payload = {
    schemaVersion: 1,
    id: 'datagrid',
    name: '@owp/datagrid',
    version: '1.0.0',
    dependencies: {},
    records: [],
    referenceRecords: [],
    examples: [],
  };

  it('shares pending requests and reuses the parsed dataset after re-entry', async () => {
    // Given
    const deferred: { complete?: (response: Response) => void } = {};
    const response = new Promise<Response>((resolve) => {
      deferred.complete = resolve;
    });
    let calls = 0;
    const load = createApiKnowledgeLoader(async () => {
      calls += 1;
      return response;
    });
    // When
    const first = load('datagrid');
    const second = load('datagrid');
    deferred.complete?.(new Response(JSON.stringify(payload)));
    const dataset = await first;
    const revisited = await load('datagrid');
    // Then
    expect(second).toBe(first);
    expect(revisited).toBe(dataset);
    expect(calls).toBe(1);
  });

  it('retries failed HTTP responses without retaining a rejected promise', async () => {
    // Given
    let calls = 0;
    const load = createApiKnowledgeLoader(async () => {
      calls += 1;
      return calls === 1
        ? new Response('', { status: 503 })
        : new Response(JSON.stringify(payload));
    });
    // When
    const failure = load('datagrid');
    // Then
    await expect(failure).rejects.toMatchObject({ reason: 'http', status: 503 });
    await expect(load('datagrid')).resolves.toMatchObject({ knowledge: { id: 'datagrid' } });
    expect(calls).toBe(2);
  });

  it('rejects unsupported package IDs before making a request', async () => {
    // Given
    let calls = 0;
    const load = createApiKnowledgeLoader(async () => {
      calls += 1;
      return new Response();
    });
    // When / Then
    await expect(load('unknown')).rejects.toBeInstanceOf(ApiKnowledgeLoadError);
    expect(calls).toBe(0);
  });

  it('rejects malformed nested records at the fetch boundary', async () => {
    // Given
    const load = createApiKnowledgeLoader(
      async () =>
        new Response(
          JSON.stringify({
            ...payload,
            records: [
              { ...data.records[0], source: { path: 'types.d.ts', line: 'invalid', sha256: '' } },
            ],
          }),
        ),
    );
    // When / Then
    await expect(load('datagrid')).rejects.toMatchObject({ reason: 'schema' });
  });

  it('retains cross-package references without broadening the package search scope', () => {
    // Given
    const base = knowledge.records[0];
    if (!base) throw new TypeError('Missing API fixture');
    const external = {
      ...base,
      id: '@owp/charts:Shared',
      package: '@owp/charts',
      owner: 'Shared',
      path: '',
      related: [],
      guideIds: [],
      typeReferences: {},
      typeDetails: undefined,
      inheritedFrom: [],
      declaredIn: undefined,
      examples: [],
    };
    const local = {
      ...external,
      id: '@owp/datagrid:Local',
      package: '@owp/datagrid',
      owner: 'Local',
      typeReferences: { Shared: external.id },
      related: [external.id],
    };
    // When
    const result = packageKnowledgeSchema.parse(
      createPackageKnowledge(
        {
          dependencies: {},
          records: [local, external],
          examples: [],
        },
        { id: 'datagrid', name: '@owp/datagrid', version: '1.0.0' },
      ),
    );
    // Then
    expect(result.records.map((record) => record.id)).toEqual([local.id]);
    expect(result.referenceRecords.map((record) => record.id)).toEqual([external.id]);
  });
});

describe('shared knowledge resources', () => {
  it('publishes usable type constraints and clean documentation for every API record', () => {
    const type = recordsById.get('@owp/charts:ChartFrameProps.type');
    expect(type?.typeParameters?.find((parameter) => parameter.name === 'TType')).toEqual({
      name: 'TType',
      constraint: 'ChartType',
      default: 'ChartType',
    });
    expect(type?.typeDetails?.values).toEqual([
      '"bar"',
      '"line"',
      '"scatter"',
      '"bubble"',
      '"pie"',
      '"doughnut"',
      '"polarArea"',
      '"radar"',
      '"boxPlot"',
      '"treemap"',
      '"heatmap"',
    ]);
    expect(type?.typeDetails?.valueKind).toBe('constraint');
    expect(type?.defaultDescription).toBeNull();
    expect(type?.typeDetails?.augmentationSources).toHaveLength(3);
    expect(recordsById.get('@owp/datagrid:OwpDataGridColumn.type')?.typeDetails?.values).toContain(
      '"datetime"',
    );
    const ratio = recordsById.get('chart.js:BarControllerDatasetOptions.barPercentage');
    expect(ratio?.description).not.toContain('@default');
    expect(ratio?.defaultDescription).toBe('0.9');
    expect(ratio?.documentation).toContain('@default 0.9');
    expect(
      recordsById.get('@owp/charts:ChartDataLabelsPluginOptions.clamp')?.defaultDescription,
    ).toBe('false');
    expect(recordsById.get('@owp/charts:ChartDataLabelsPluginOptions.clamp')?.defaultNote).toBe(
      '(no clamping)',
    );
    expect(recordsById.get('@owp/datagrid:OwpDataGridProps.treeOptions')?.defaultDescription).toBe(
      'flat grid',
    );
    for (const record of knowledge.records) {
      expect(record.description).not.toMatch(/^\s*@\w+/m);
      for (const id of record.typeDetails?.sources ?? [])
        expect(recordsById.has(id), `${record.id}/${id}`).toBe(true);
    }
  });
  it('retains all tree configuration branches and searches structured documentation', () => {
    const mode = recordsById.get('@owp/datagrid:OwpDataGridTreeOptions.mode');
    expect(mode?.typeDetails?.values).toEqual(['"nested"', '"parent-reference"']);
    expect(mode?.inheritedFrom).toHaveLength(2);
    expect(mode?.requirement).toBe('conditional');
    expect(
      recordsById.get('@owp/datagrid:OwpDataGridTreeOptions.getParentRowId')?.signature,
    ).toContain('=>');
    expect(
      recordsById.get('@owp/datagrid:OwpDataGridTreeOptions.getParentRowId')?.typeDetails?.values,
    ).toEqual([]);
    expect(
      recordsById.get('@owp/datagrid:OwpDataGridTreeOptions.orphanRowPolicy')?.typeDetails?.values,
    ).toEqual(['undefined', '"error"', '"root"']);
    const ratio = recordsById.get('chart.js:BarControllerDatasetOptions.barPercentage');
    const clamp = recordsById.get('@owp/charts:ChartDataLabelsPluginOptions.clamp');
    expect(ratio && matchesApiQuery(ratio, '0.9')).toBe(true);
    expect(clamp && matchesApiQuery(clamp, 'no clamping')).toBe(true);
    expect(mode && matchesApiQuery(mode, 'parent-reference')).toBe(true);
  });
  it('connects every published example and guide to existing symbols and sources', () => {
    for (const example of data.examples)
      for (const reference of example.references) {
        const record = recordsById.get(reference.id);
        expect(record, `${example.packageId}/${example.id}/${reference.label}`).toBeDefined();
        expect(
          record?.examples.some(
            (entry) => entry.packageId === example.packageId && entry.id === example.id,
          ),
        ).toBe(true);
      }
    for (const record of knowledge.records)
      for (const related of [...record.related, ...record.guideIds])
        expect(recordsById.has(related), `${record.id}/${related}`).toBe(true);
    for (const source of data.sourceAudit.sources)
      for (const section of source.sections)
        for (const guideId of section.guideIds)
          expect(recordsById.get(guideId)?.kind).toBe('guide');
  });

  it('retains the current Enter contract and conditional Treemap accessor requirement', () => {
    expect(recordsById.get('@owp/datagrid:OwpDataGridProps.enterKeyAction')?.description).toContain(
      '기본값 nextEditableCell',
    );
    expect(
      recordsById.get('@owp/datagrid:OwpDataGridProps.enterKeyAction')?.defaultDescription,
    ).toBe('nextEditableCell');
    expect(recordsById.get('@owp/datagrid:OwpDataGridTimeOptions.format')?.defaultDescription).toBe(
      'HH:mm',
    );
    expect(
      recordsById.get('@owp/datagrid:OwpDataGridProps.rowSelectionPropagation')?.defaultDescription,
    ).toContain('descendants/parents 모두 true');
    expect(recordsById.get('@owp/charts:OwpTreemapChartProps.accessors')?.requirement).toBe(
      'conditional',
    );
    expect(recordsById.get('@owp/charts:ChartFrameProps.data')?.requirement).toBe('required');
    expect(recordsById.get('@owp/charts:ChartFrameProps.options')?.requirement).toBe('optional');
    expect(recordsById.get('@owp/charts:ChartFrameProps.options')?.defaultDescription).toBe('{}');
    expect(recordsById.get('@owp/charts:OwpTreemapChartProps.formatter')?.guideIds).toContain(
      '@owp/charts:guide.geometry',
    );
    expect(
      recordsById.get('@owp/datagrid:OwpDataGridDetailPanelOptions.renderDetail')?.guideIds,
    ).toContain('@owp/datagrid:guide.tree-detail');
    expect(recordsById.has('@owp/charts:OwpAreaChartProps.type')).toBe(false);
    expect(exampleApiLinks('charts', 'treemap').map((reference) => reference.label)).toEqual(
      expect.arrayContaining([
        'OwpTreemapChart',
        'ChartFrame',
        'type',
        'createTreemapData',
        'data',
        'style',
        'formatter',
      ]),
    );
    expect(exampleApiLinks('charts', 'treemap').map((reference) => reference.id)).toEqual(
      expect.arrayContaining([
        '@owp/charts:OwpTreemapChartProps.height',
        '@owp/charts:OwpTreemapChartProps.options',
        '@owp/charts:OwpTreemapChartProps.showExportButton',
        '@owp/charts:ChartFrameProps.data',
      ]),
    );
  });

  it('preserves public documentation, concrete inherited types and plugin contracts', () => {
    expect(recordsById.get('@owp/datagrid:createDataGridRows')?.description).toContain(
      '같은 입력 순서',
    );
    expect(recordsById.get('@owp/datagrid:createDataGridSequenceUpdatePlan')?.description).not.toBe(
      '',
    );
    expect(recordsById.get('@owp/datagrid:OwpDataGrid')?.kind).toBe('component');
    expect(recordsById.get('@owp/datagrid:OwpDataGrid')?.related).toContain(
      '@owp/datagrid:OwpDataGridProps',
    );
    expect(recordsById.get('@owp/charts:OwpAreaChartProps.options')).toMatchObject({
      signature: "ChartOptions<'line'>",
      declarationSignature: 'ChartOptions<TType>',
    });
    const required = [
      'hoverAreaColor',
      'referenceAxis',
      'referenceLineColor',
      'showHoverArea',
      'showReferenceLine',
    ];
    for (const name of required)
      expect(
        recordsById.get(`@owp/charts:ChartInteractionLayerPluginOptions.${name}`)?.requirement,
      ).toBe('required');
    expect(
      recordsById.get('@owp/charts:ChartInteractionLayerPluginOptions.disabled')?.requirement,
    ).toBe('optional');
    expect(
      recordsById.get('@owp/charts:ChartDataLabelsPluginOptions.formatter')?.signature,
    ).toContain('context: Context');
    expect(
      recordsById.get('@owp/charts:ChartDataLabelsPluginOptions.formatter')?.description,
    ).toContain('label text');
    expect(recordsById.get('@owp/charts:ChartDataLabelsContext.dataIndex')?.signature).toBe(
      'number',
    );
    expect(recordsById.get('@owp/charts:ChartAnnotationPluginOptions.annotations')).toBeDefined();
    expect(exampleApiLinks('charts', 'box-plot')).toContainEqual({
      label: 'BoxPlotDatasetOptions',
      id: '@owp/charts:BoxPlotDatasetOptions',
      packageId: 'charts',
    });
    expect(
      exampleApiLinks('charts', 'box-plot').some((link) => link.label === 'datasetOptions'),
    ).toBe(false);
    expect(recordsById.get('@owp/charts:BoxPlotDatasetOptions')?.related).toContain(
      '@owp/charts:BoxPlotElementOptions',
    );
    expect(
      packageRecords('charts').some((record) => record.package === 'chartjs-plugin-annotation'),
    ).toBe(true);
  });

  it('connects public time APIs and their entrypoints to the composition guide', () => {
    const guideId = '@owp/charts:guide.composition';
    const register = recordsById.get('@owp/charts:registerChartTime');
    expect(register?.imports).toEqual(['@owp/charts/chartjs/time']);
    for (const name of [
      'registerChartTime',
      'ChartTimeValue',
      'ChartTimePoint',
      'ChartTimeAdapterOptions',
    ]) {
      const id = `@owp/charts:${name}`;
      expect(recordsById.get(guideId)?.related).toContain(id);
      expect(recordsById.get(id)?.guideIds).toContain(guideId);
    }
  });

  it('exports the UI records with version, citation URL and executable source links', () => {
    const assets = knowledgeAssets();
    expect(assets.has('knowledge/index.json')).toBe(true);
    for (const packageId of ['datagrid', 'charts']) {
      const text = assets.get(`api/${packageId}.json`);
      expect(text).toBeDefined();
      expect(text).toContain(packageRecords(packageId)[0]?.contentHash);
    }
    const lines = assets.get('knowledge/records.jsonl')?.trim().split('\n') ?? [];
    expect(lines).toHaveLength(knowledge.records.length);
    expect(assets.get('knowledge/guides/datagrid/saving.md')).toContain(
      '/snippets/playgrounds/datagrid/examples/server-save.tsx',
    );
    expect(assets.get('knowledge/guides/charts/zoom.md')).toContain(
      'Canonical URL: /?package=charts&view=api&symbol=',
    );
  });
});
