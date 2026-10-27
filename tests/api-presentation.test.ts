import { describe, expect, it } from 'vitest';
import type { ApiRecord } from '../src/features/api/model/knowledge';
import { recordsById } from './fixtures/api-knowledge';
import {
  compareApiMembers,
  descriptionOrigins,
  filterRelatedRecords,
} from '../src/features/api/model/presentation';

function fixture(overrides: Partial<ApiRecord> = {}): ApiRecord {
  return {
    id: '@owp/charts:Options.value',
    package: '@owp/charts',
    packageVersion: '1.0.0',
    owner: 'Options',
    name: 'value',
    path: 'value',
    kind: 'property',
    imports: [],
    description: 'The associated chart.',
    body: '',
    signature: 'string',
    requirement: 'optional',
    related: [],
    guideIds: [],
    locale: 'en',
    defaultDescription: null,
    usageNote: null,
    examples: [],
    source: { path: 'types.d.ts', line: 1, sha256: '' },
    sources: [],
    url: '',
    contentHash: '',
    ...overrides,
  };
}

describe('API member ordering', () => {
  it('keeps boolean settings before values, then events and methods', () => {
    const fields = [
      ['onChange', '(value: string) => void', 'property'],
      ['renderCell', '(value: string) => ReactNode', 'property'],
      ['getRowId', '(row: Row) => string', 'property'],
      ['animation', 'false | Options', 'property'],
      ['visible', 'boolean | undefined', 'property'],
      ['editable', 'false | true', 'property'],
      ['disabled', 'false | undefined', 'property'],
      ['columns', 'Column[]', 'property'],
      ['clear', '() => void', 'method'],
      ['change', '(event: Event) => void', 'event'],
      ['active', 'boolean', 'property'],
    ] as const;
    const records = fields.map(([name, signature, kind]) =>
      fixture({ id: `@owp/charts:Options.${name}`, name, signature, kind }),
    );
    expect([...records].sort(compareApiMembers).map((record) => record.name)).toEqual([
      'active',
      'disabled',
      'editable',
      'visible',
      'animation',
      'columns',
      'getRowId',
      'renderCell',
      'change',
      'clear',
      'onChange',
    ]);
  });

  it.each(['false | Options', 'boolean[]', 'Boolean', 'boolean | null', 'boolean | (() => void)'])(
    'does not classify %s as a boolean-only setting',
    (signature) => {
      const value = fixture({ name: 'aValue', signature });
      const toggle = fixture({ name: 'zToggle', signature: 'boolean' });
      expect([value, toggle].sort(compareApiMembers)).toEqual([toggle, value]);
    },
  );

  it('orders names deterministically without the selected UI locale', () => {
    const records = ['zebra', 'Alpha', 'beta'].map((name) => fixture({ name, id: name }));
    expect([...records].sort(compareApiMembers).map((record) => record.name)).toEqual([
      'Alpha',
      'beta',
      'zebra',
    ]);
    expect(compareApiMembers(records[0] ?? fixture(), records[0] ?? fixture())).toBe(0);
  });
});

describe('verified description origins', () => {
  it('resolves the real DataLabels member rather than the Chart type it references', () => {
    const source = recordsById.get('chartjs-plugin-datalabels:Context.chart');
    if (!source) throw new TypeError('Missing DataLabels Context.chart fixture');
    const record = {
      ...source,
      id: '@owp/charts:ExampleContext.chart',
      package: '@owp/charts',
      declaredIn: source.id,
    };
    expect(descriptionOrigins(record, recordsById).map((origin) => origin.id)).toEqual([
      'chartjs-plugin-datalabels:Context.chart',
    ]);
  });

  it('follows identical descriptions across multiple inheritance levels and cycles', () => {
    const source = fixture({ id: 'chart.js:Context.chart', package: 'chart.js' });
    const base = fixture({
      id: '@owp/charts:Base.chart',
      inheritedFrom: [source.id, '@owp/charts:Options.value'],
    });
    const record = fixture({ declaredIn: base.id });
    const map = new Map([source, base, record].map((entry) => [entry.id, entry]));
    expect(descriptionOrigins(record, map)).toEqual([source]);
  });

  it('does not label an OWP rewrite as the inherited external description', () => {
    const source = fixture({ id: 'chart.js:Options.value', package: 'chart.js' });
    const record = fixture({
      description: 'OWP selects the associated chart.',
      declaredIn: source.id,
    });
    expect(descriptionOrigins(record, new Map([[source.id, source]]))).toEqual([]);
  });

  it('does not cross an intermediate description rewrite', () => {
    const source = fixture({ id: 'chart.js:Options.value', package: 'chart.js' });
    const base = fixture({
      id: '@owp/charts:Base.value',
      description: 'Rewritten by OWP.',
      declaredIn: source.id,
    });
    const record = fixture({ declaredIn: base.id });
    expect(
      descriptionOrigins(record, new Map([source, base].map((entry) => [entry.id, entry]))),
    ).toEqual([]);
  });

  it.each([
    'chart.js',
    'chartjs-plugin-annotation',
    'chartjs-plugin-datalabels',
    'react-chartjs-2',
  ])('preserves the actual %s package for a direct external record', (packageName) => {
    const record = fixture({ id: `${packageName}:Context.chart`, package: packageName });
    expect(descriptionOrigins(record, new Map())).toEqual([record]);
  });

  it('does not infer an origin from matching names, type references or related records', () => {
    const source = fixture({ id: 'chart.js:Context.chart', package: 'chart.js' });
    const record = fixture({ related: [source.id], typeReferences: { Chart: source.id } });
    expect(descriptionOrigins(record, new Map([[source.id, source]]))).toEqual([]);
  });
});

describe('related API search', () => {
  it('filters identifiers and prose, handles no matches, and restores the full list when cleared', () => {
    const records = [
      fixture({
        id: 'guide',
        name: '구성 가이드',
        owner: 'guide',
        kind: 'guide',
        description: '시리즈를 조합합니다.',
      }),
      fixture({
        id: 'chart.js:ChartOptions',
        name: 'ChartOptions',
        owner: 'ChartOptions',
        package: 'chart.js',
        description: 'Chart configuration options.',
      }),
      fixture({
        id: 'labels',
        name: 'ChartDataLabelsContext',
        owner: 'ChartDataLabelsContext',
        description: 'Data labels callback context.',
      }),
    ];
    expect(filterRelatedRecords(records, '  CHART options ').map((record) => record.id)).toEqual([
      'chart.js:ChartOptions',
    ]);
    expect(filterRelatedRecords(records, '시리즈').map((record) => record.id)).toEqual(['guide']);
    expect(filterRelatedRecords(records, 'no matching entry')).toEqual([]);
    expect(filterRelatedRecords(records, '')).toEqual(records);
    expect(records).toHaveLength(3);
  });
});
