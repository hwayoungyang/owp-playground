import assert from 'node:assert/strict';
import { test } from 'vitest';
import { describeApiTypes } from '../scripts/api-type-details.mjs';
import { parseDocumentation } from '../scripts/api-documentation.mjs';
import { inheritApiMembers } from '../scripts/api-inheritance.mjs';

const record = (name, signature, extra = {}) => ({
  id: `pkg:${name}`,
  package: 'pkg',
  owner: name.split('.')[0],
  path: name.includes('.') ? name.split('.').slice(1).join('.') : '',
  signature,
  related: [],
  typeParameters: [],
  typeReferences: {},
  bases: [],
  ...extra,
});

test('resolves aliases and generic constraints without treating a type default as a runtime default', () => {
  const records = [
    record('Mode', "type Mode = 'client' | 'manual';"),
    record('Props.mode', 'TMode', {
      typeParameters: [{ name: 'TMode', constraint: 'Mode', default: "'client'" }],
    }),
    record('Props.callback', 'Mode | ((value: number) => string)'),
    record('Props.open', 'Mode | string'),
    record('Props.data', 'TData', {
      typeParameters: [{ name: 'TData', constraint: null, default: 'number[]' }],
    }),
  ];
  const result = new Map(describeApiTypes(records).map((entry) => [entry.id, entry]));
  assert.deepEqual(result.get('pkg:Props.mode').typeDetails.values, ['"client"', '"manual"']);
  assert.equal(result.get('pkg:Props.mode').typeDetails.valueKind, 'constraint');
  for (const name of ['callback', 'open', 'data'])
    assert.deepEqual(result.get(`pkg:Props.${name}`).typeDetails.values, []);
  assert.equal(result.get('pkg:Props.mode').defaultDescription, undefined);
});

test('includes installed registry augmentations and records their provenance', () => {
  const source = { path: 'plugin/index.d.ts', line: 10, sha256: 'abc' };
  const result = describeApiTypes(
    [
      record('Registry', 'interface Registry { line: {}; bar: {}; }'),
      record('Kind', 'type Kind = keyof Registry;'),
      record('Props.type', 'Kind'),
    ],
    [{ id: 'pkg:Registry', keys: ['custom'], source }],
  );
  const detail = result.find((entry) => entry.id === 'pkg:Props.type').typeDetails;
  assert.deepEqual(detail.values, ['"line"', '"bar"', '"custom"']);
  assert.equal(detail.extensible, true);
  assert.deepEqual(detail.augmentationSources, [source]);
  const open = describeApiTypes([
    record('Registry', 'interface Registry { [name: string]: {}; }'),
    record('Kind', 'type Kind = keyof Registry;'),
  ]);
  assert.deepEqual(open.at(-1).typeDetails.values, []);
});

test('handles cycles and literal values without confusing keys, functions or generic shadowing', () => {
  const result = describeApiTypes([
    record('First', 'type First = Second;'),
    record('Second', 'type Second = First;'),
    record('Props.value', "'auto' | -1 | null | undefined"),
    record('Props.fn', "<T extends 'a' | 'b'>(value: T) => T"),
  ]);
  assert.deepEqual(result[0].typeDetails.values, []);
  assert.deepEqual(result[2].typeDetails.values, ['"auto"', '-1', 'null', 'undefined']);
  assert.deepEqual(result[3].typeDetails.values, []);
});

test('an inherited generic member uses the current owner parameter constraints', () => {
  const records = inheritApiMembers([
    record('Parent', "interface Parent<T extends 'a' | 'b'> { value: T; }", {
      typeParameters: [{ name: 'T', constraint: "'a' | 'b'", default: null }],
    }),
    record('Parent.value', 'T'),
    record('Child', "interface Child<U extends 'b'> extends Parent<U> {}", {
      typeParameters: [{ name: 'U', constraint: "'b'", default: null }],
      bases: [
        { id: 'pkg:Parent', arguments: ['U'], omit: [], pick: [], partial: false, required: false },
      ],
    }),
  ]);
  const child = describeApiTypes(records).find((entry) => entry.id === 'pkg:Child.value');
  assert.equal(child.signature, 'U');
  assert.deepEqual(child.typeDetails.values, ['"b"']);
});

test('separates JSDoc block tags, multiline content and annotated defaults without losing source text', () => {
  const raw =
    'Bar width ratio.\n@default 0.9\n@see https://example.test/bar\n@param value Input value\n  continued\n@returns New value';
  const parsed = parseDocumentation(raw);
  assert.equal(parsed.description, 'Bar width ratio.');
  assert.equal(parsed.defaultDescription, '0.9');
  assert.equal(parsed.documentation, raw);
  assert.equal(
    parsed.docTags.find((tag) => tag.name === 'param').text,
    'value Input value\n  continued',
  );
  assert.equal(parseDocumentation('@default false (no clamping)').defaultDescription, 'false');
  assert.equal(
    parseDocumentation('@default data[index] // parsed as string').defaultDescription,
    'data[index]',
  );
  assert.equal(parseDocumentation('Tree (default: flat grid)').defaultDescription, 'flat grid');
  assert.equal(
    parseDocumentation('@default "rgba(0,0,0,1)"').defaultDescription,
    '"rgba(0,0,0,1)"',
  );
  assert.equal(parseDocumentation('기본값 HH:mm').defaultDescription, 'HH:mm');
  assert.equal(parseDocumentation('기본값 0.5rem').defaultDescription, '기본값 0.5rem');
});

test('merges union branches and does not call callback unions a closed set', () => {
  const branch = (id) => ({
    id,
    arguments: [],
    omit: [],
    pick: [],
    partial: false,
    required: false,
    conditional: true,
  });
  const records = [
    record('Nested', 'interface Nested { mode?: "nested"; parent?: undefined }'),
    record('Nested.mode', '"nested"', { optional: true, requirement: 'optional' }),
    record('Nested.parent', 'undefined', { optional: true, requirement: 'optional' }),
    record('Linked', 'interface Linked { mode: "linked"; parent: (row: unknown) => string }'),
    record('Linked.mode', '"linked"', { optional: false, requirement: 'required' }),
    record('Linked.parent', '(row: unknown) => string', {
      optional: false,
      requirement: 'required',
    }),
    record('Tree', 'type Tree = Nested | Linked;', {
      bases: [branch('pkg:Nested'), branch('pkg:Linked')],
    }),
  ];
  const result = describeApiTypes(inheritApiMembers(records));
  const mode = result.find((entry) => entry.id === 'pkg:Tree.mode');
  const parent = result.find((entry) => entry.id === 'pkg:Tree.parent');
  assert.deepEqual(mode.typeDetails.values, ['"nested"', '"linked"']);
  assert.equal(mode.requirement, 'conditional');
  assert.deepEqual(parent.typeDetails.values, []);
  assert.match(parent.signature, /undefined \| \(\(row: unknown\) => string\)/);
  const intersection = describeApiTypes(
    inheritApiMembers([
      ...records.slice(0, 6),
      record('Both', 'type Both = Nested & Linked;', {
        bases: [branch('pkg:Nested'), branch('pkg:Linked')].map((base) => ({
          ...base,
          conditional: false,
        })),
      }),
    ]),
  );
  assert.deepEqual(
    intersection.find((entry) => entry.id === 'pkg:Both.mode').typeDetails.values,
    [],
  );
});

test('preserves ambiguous local type names from either side of a nested union', () => {
  const base = (id) => ({
    id,
    arguments: [],
    omit: [],
    pick: [],
    partial: false,
    required: false,
    conditional: true,
  });
  const declarations = ['a', 'b', 'c'].flatMap((value) => [
    record(`Mode${value}`, `type Mode = '${value}';`, { id: `${value}:Mode`, package: value }),
    record(value.toUpperCase(), 'interface Source { mode: Mode; }'),
    record(`${value.toUpperCase()}.mode`, 'Mode', {
      typeReferences: { Mode: `${value}:Mode` },
      requirement: 'required',
      optional: false,
    }),
  ]);
  const records = [
    ...declarations,
    record('BC', 'type BC = B | C;', { bases: [base('pkg:B'), base('pkg:C')] }),
    record('ABC', 'type ABC = A | BC;', { bases: [base('pkg:A'), base('pkg:BC')] }),
    record('BCA', 'type BCA = BC | A;', { bases: [base('pkg:BC'), base('pkg:A')] }),
  ];
  for (const name of ['BC', 'ABC', 'BCA']) {
    const result = describeApiTypes(inheritApiMembers(records)).find(
      (entry) => entry.id === `pkg:${name}.mode`,
    );
    assert.deepEqual(result.typeReferenceConflicts, ['Mode']);
    assert.deepEqual(result.typeDetails.values, []);
    assert.equal(result.typeDetails.valueKind, null);
    assert.equal(result.typeReferences.Mode, undefined);
  }
});
