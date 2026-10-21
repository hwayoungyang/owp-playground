import '../src/app/i18n';
import i18next from 'i18next';
import { parse } from 'jsonc-parser';
import { describe, expect, it } from 'vitest';
import { type ApiField, formatApiData } from '../src/features/code/api-data';
import { highlightSource } from '../src/features/code/highlight';
import { chartApiDocument, chartFromApi } from '../src/playgrounds/charts/model/apiData';
import { gridApiDocument, taskFromApi, taskToApi } from '../src/playgrounds/datagrid/model/apiData';
import { createNestedTree, createTree, initialTasks } from '../src/playgrounds/datagrid/model/data';
import { worksheetRows } from '../src/playgrounds/datagrid/model/worksheet-data';

const localize = i18next.getFixedT('ko', 'owp');

describe('OWP API data examples', () => {
  it('preserves chart labels, null gaps, negative values and series order across API mapping', () => {
    const snapshot = {
      labels: ['2026-01-01T01:00:00Z', '2026-01-01T01:00:01Z', '2026-01-01T01:00:02Z'],
      series: [
        { label: '온도', values: [-1.25, null, 0] },
        { label: '압력', values: [32, 45.2, 39.7] },
      ],
    };
    const source = chartApiDocument(snapshot, 'time-series', localize);
    const rows = source.getRows(0, source.totalRows);
    expect(rows[0]).toEqual({
      'OWP_DATA.DATA1': '2026-01-01T01:00:00Z',
      'OWP_DATA.DATA2': '-1.25',
      'OWP_DATA.DATA3': '32',
    });
    expect(chartFromApi(rows, ['온도', '압력'])).toEqual(snapshot);
    expect(() =>
      chartFromApi([{ 'OWP_DATA.DATA1': 'A', 'OWP_DATA.DATA2': 'invalid' }], ['온도']),
    ).toThrow(TypeError);
  });

  it('reads the requested range without shifting series values or truncating the source', () => {
    const source = chartApiDocument(
      {
        labels: Array.from({ length: 205 }, (_, index) => String(index)),
        series: [
          { label: '측정값', values: Array.from({ length: 205 }, (_, index) => index * 0.5) },
        ],
      },
      'line',
      localize,
    );
    expect(source.totalRows).toBe(205);
    expect(source.getRows(100, 200)).toHaveLength(100);
    expect(source.getRows(100, 200)[0]).toEqual({
      'OWP_DATA.DATA1': '100',
      'OWP_DATA.DATA2': '50',
    });
    expect(source.getRows(200, 205)).toHaveLength(5);
  });

  it('preserves parent references, nested children, booleans and worksheet fields', () => {
    for (const row of [...createTree(), ...createNestedTree(), ...worksheetRows]) {
      expect(taskFromApi(taskToApi(row))).toEqual(row);
    }
    const source = gridApiDocument(createNestedTree(), localize);
    expect(source.fields.find((field) => field.key === 'OWP_DATA.DATA17')?.description).toContain(
      'DATA1',
    );
    expect(source.fields.find((field) => field.key === 'OWP_DATA.DATA19')?.description).toContain(
      'getChildren',
    );
  });

  it('deduplicates flattened nested rows and preserves current child edits', () => {
    const roots = createNestedTree();
    const all = roots.flatMap(function flatten(row): typeof roots {
      return [row, ...(row.children ?? []).flatMap(flatten)];
    });
    const leaf = all.find((row) => row.id === 'step-0-0-0-0');
    if (!leaf) throw new TypeError('Missing nested fixture');
    const source = gridApiDocument(
      all.map((row) => (row.id === leaf.id ? { ...row, task: '수정한 하위 작업' } : row)),
      localize,
    );
    expect(source.totalRows).toBe(3);
    const restored = source.getRows(0, 3).map(taskFromApi);
    expect(restored[0]?.children?.[0]?.children?.[0]?.children?.[0]?.task).toBe('수정한 하위 작업');
  });

  it('keeps edited values and rejects invalid numbers and boolean strings', () => {
    const original = initialTasks[0];
    if (!original) throw new TypeError('Missing fixture');
    const row = {
      ...original,
      task: '설비 점검\nhttps://example.test/a//b',
      completed: 0,
      active: false,
      note: '',
    };
    const api = taskToApi(row);
    expect(taskFromApi(api)).toEqual(row);
    expect(api['OWP_DATA.DATA14']).toBe('0');
    expect(() => taskFromApi({ ...api, 'OWP_DATA.DATA6': '' })).toThrow(TypeError);
    expect(() => taskFromApi({ ...api, 'OWP_DATA.DATA14': 'false' })).toThrow(TypeError);
  });

  it('adds safe JSONC comments without changing valid JSON values or nested arrays', () => {
    const source = gridApiDocument(createNestedTree(), localize);
    const document = { fields: source.fields, rows: source.getRows(0, 1) };
    const json = formatApiData(document, false);
    const jsonc = formatApiData(document, true);
    expect(JSON.parse(json)).toEqual(document.rows);
    expect(jsonc).toContain('"OWP_DATA.DATA19": [ //');
    expect(jsonc).toContain('부모 참조');
    expect(highlightSource(jsonc, 'jsonc')).toContain('hljs-comment');
    expect(
      formatApiData(
        {
          rows: [{ 'OWP_DATA.DATA1': 'a//b\n"c"' }],
          fields: [{ key: 'OWP_DATA.DATA1', description: 'one\ntwo' }],
        },
        true,
      ),
    ).toContain('// one two');
  });

  it('shows each description once across repeated fields and nested rows on a page', () => {
    const rows = [
      {
        'OWP_DATA.DATA1': 'A',
        'OWP_DATA.DATA19': [
          { 'OWP_DATA.DATA1': 'A-1', 'OWP_DATA.DATA2': 'A' },
          { 'OWP_DATA.DATA1': 'A-2', 'OWP_DATA.DATA2': 'A' },
        ],
      },
      {
        'OWP_DATA.DATA1': 'B',
        'OWP_DATA.DATA2': 'B-1',
        'OWP_DATA.DATA3': '35',
        'OWP_DATA.DATA19': [{ 'OWP_DATA.DATA1': 'B-1' }],
      },
    ] as const;
    const fields = [
      { key: 'OWP_DATA.DATA1', description: '식별자' },
      { key: 'OWP_DATA.DATA2', description: '식별자' },
      { key: 'OWP_DATA.DATA3', description: '생산량' },
      { key: 'OWP_DATA.DATA19', description: '하위 행\n목록' },
    ] as const;
    const jsonc = formatApiData({ rows, fields }, true);
    expect(jsonc.match(/\/\/ 식별자/g)).toHaveLength(1);
    expect(jsonc.match(/\/\/ 하위 행 목록/g)).toHaveLength(1);
    expect(jsonc).toContain('"OWP_DATA.DATA3": "35", // 생산량');
    expect(JSON.parse(formatApiData({ rows, fields }, false))).toEqual(rows);
    expect(formatApiData({ rows: rows.slice(1), fields }, true)).toContain(
      '"OWP_DATA.DATA1": "B", // 식별자',
    );
  });

  it('shows shared notes once while preserving distinct field descriptions on each page', () => {
    const rows = [
      { 'OWP_DATA.DATA1': 'A', 'OWP_DATA.DATA2': '10', 'OWP_DATA.DATA3': null },
      { 'OWP_DATA.DATA1': 'B', 'OWP_DATA.DATA2': '20', 'OWP_DATA.DATA3': '30' },
    ] as const;
    const fields: readonly ApiField[] = [
      { key: 'OWP_DATA.DATA1', description: 'category', notes: ['shared\nformat'] },
      { key: 'OWP_DATA.DATA2', description: 'first series', notes: ['shared format', 'nullable'] },
      { key: 'OWP_DATA.DATA3', description: 'second series', notes: ['nullable'] },
    ];

    const pages = [rows, rows.slice(1)].map((pageRows) => ({
      rows: pageRows,
      jsonc: formatApiData({ rows: pageRows, fields }, true),
      json: formatApiData({ rows: pageRows, fields }, false),
    }));

    for (const page of pages) {
      for (const text of [
        'category',
        'first series',
        'second series',
        'shared format',
        'nullable',
      ]) {
        expect(page.jsonc.split(text)).toHaveLength(2);
      }
      expect(parse(page.jsonc)).toEqual(page.rows);
      expect(JSON.parse(page.json)).toEqual(page.rows);
      expect(page.json).not.toContain('//');
    }
  });
});
