import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSync } from 'vite';
import { readDeclarations } from '../scripts/api-declarations.mjs';
import { inheritApiMembers } from '../scripts/api-inheritance.mjs';
import { resolveExampleReferences } from '../scripts/api-references.mjs';

describe('API declaration contracts', () => {
  it('follows exports, preserves conditional members and respects generic scope', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'owp-api-'));
    try {
      await mkdir(path.join(directory, 'dist'));
      await writeFile(
        path.join(directory, 'package.json'),
        JSON.stringify({
          name: '@example/grid',
          version: '1.0.0',
          exports: { types: './index.d.ts', import: './index.js' },
        }),
      );
      await writeFile(
        path.join(directory, 'index.d.ts'),
        "export { Example, Other as T, Base, Derived, Identity, Callback } from './types';\n",
      );
      await writeFile(
        path.join(directory, 'other.d.ts'),
        'export interface Other { wrong: string }\n',
      );
      await writeFile(
        path.join(directory, 'types.d.ts'),
        "import { Other as T } from './other';\nexport { Other } from './other';\nexport type Identity<T> = T;\nexport type Example<T> = { /** Row input. */ rows: readonly T[] } & (T extends string ? { accessors?: string } : { accessors: number });\nexport interface Base { required: string; optional?: number; removed: boolean; }\nexport type Derived = Partial<Omit<Base, 'removed'>> & { own: boolean };\nexport type Callback = { render?: never } | { render: (value: string) => string };\n",
      );
      const { records } = await readDeclarations(directory);
      expect(records.find((record) => record.name === 'rows')).toMatchObject({
        signature: 'readonly T[]',
        requirement: 'required',
        related: [],
      });
      expect(records.find((record) => record.name === 'accessors')).toMatchObject({
        requirement: 'conditional',
        signature: 'string | number',
      });
      expect(new Set(records.map((record) => record.id)).size).toBe(records.length);
      const callback = records.find((record) => record.id === '@example/grid:Callback.render');
      expect(callback).toBeDefined();
      expect(parseSync('callback.ts', `type Callback = ${callback.signature};`).errors).toEqual([]);
      const inherited = inheritApiMembers(records);
      expect(
        inherited.find((record) => record.id === '@example/grid:Derived.required'),
      ).toMatchObject({ requirement: 'optional', declaredIn: '@example/grid:Base.required' });
      expect(inherited.some((record) => record.id === '@example/grid:Derived.removed')).toBe(false);
      expect(
        inherited.find((record) => record.id === '@example/grid:Derived.own')?.requirement,
      ).toBe('required');
      expect(inherited.some((record) => record.id === '@example/grid:Identity.wrong')).toBe(false);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('rejects an example API name with no verified declaration target', () => {
    expect(() =>
      resolveExampleReferences({
        packageId: 'datagrid',
        examples: [{ id: 'obsolete', api: ['removedProp'] }],
        records: [],
        sourceText: new Map(),
      }),
    ).toThrow('removedProp');
  });

  it('preserves variable JSDoc, callable aliases and concrete utility-type inheritance', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'owp-inheritance-'));
    try {
      await mkdir(path.join(directory, 'dist'));
      await writeFile(
        path.join(directory, 'package.json'),
        JSON.stringify({ name: '@example/chart', version: '1.0.0', types: 'index.d.ts' }),
      );
      await writeFile(
        path.join(directory, 'index.d.ts'),
        `
export interface Base<T, U = T> {
  value: T;
  list: T[];
  optional?: U;
  /** A callback with its own generic. */
  // eslint-disable-next-line example-rule
  callback?: <T>(value: T) => T;
  label: 'T';
  object: { T: T };
}
export interface Middle<V> extends Base<V> {}
export type Concrete = Required<Pick<Middle<'line'>, 'value' | 'list' | 'optional' | 'callback' | 'label' | 'object'>>;
export type PartialAgain = Partial<Required<Pick<Base<string>, 'optional'>>>;
export type RequiredAgain = Required<Partial<Pick<Base<number>, 'optional'>>>;
export interface DemoGridProps { rows: string[] }
export type CallableType = (value: string) => string;
declare const WithRef: (props: DemoGridProps) => unknown;
/** Public component contract. */
export declare const DemoGrid: typeof WithRef;
export declare const Dialog: import('react').ForwardRefExoticComponent<DemoGridProps>;
export declare const Carded: import('react').NamedExoticComponent<DemoGridProps> & { displayName?: string };
export declare const NonReact: import('other').NamedExoticComponent<DemoGridProps>;
export declare const UppercaseValue: number;
/** Stable only for the same input order. */
export declare const createRows: (rows: string[]) => string[];
export type Mode = 'line' | 'bar';
export interface GenericProps<T extends Mode = 'line'> { type: T }
declare module 'chart.js' { interface ChartTypeRegistry { custom: {} } }
`,
      );
      const { records, augmentations } = await readDeclarations(directory);
      expect(
        records.find((record) => record.id === '@example/chart:GenericProps')?.typeParameters,
      ).toEqual([{ name: 'T', constraint: 'Mode', default: "'line'" }]);
      expect(augmentations).toMatchObject([
        {
          id: 'chart.js:ChartTypeRegistry',
          keys: ['custom'],
          open: false,
          source: { path: '@example/chart/index.d.ts' },
        },
      ]);
      const inherited = new Map(inheritApiMembers(records).map((record) => [record.id, record]));
      expect(inherited.get('@example/chart:createRows')?.description).toContain('same input order');
      expect(inherited.get('@example/chart:DemoGrid')).toMatchObject({
        kind: 'component',
        description: 'Public component contract.',
      });
      expect(inherited.get('@example/chart:DemoGrid')?.related).toContain(
        '@example/chart:DemoGridProps',
      );
      expect(inherited.get('@example/chart:CallableType')?.kind).toBe('type');
      expect(inherited.get('@example/chart:Dialog')?.kind).toBe('component');
      expect(inherited.get('@example/chart:Carded')?.kind).toBe('component');
      expect(inherited.get('@example/chart:NonReact')?.kind).toBe('constant');
      expect(inherited.get('@example/chart:UppercaseValue')?.kind).toBe('constant');
      expect(inherited.get('@example/chart:Concrete.optional')).toMatchObject({
        signature: "'line'",
        requirement: 'required',
        optional: false,
        declarationSignature: 'U',
      });
      expect(inherited.get('@example/chart:Concrete.list')?.signature).toBe("'line'[]");
      expect(inherited.get('@example/chart:Concrete.callback')).toMatchObject({
        signature: '<T>(value: T) => T',
        description: 'A callback with its own generic.',
      });
      expect(inherited.get('@example/chart:Concrete.label')?.signature).toBe("'T'");
      expect(inherited.get('@example/chart:Concrete.object')?.signature).toBe("{ T: 'line' }");
      expect(inherited.get('@example/chart:PartialAgain.optional')).toMatchObject({
        signature: 'string',
        requirement: 'optional',
      });
      expect(inherited.get('@example/chart:RequiredAgain.optional')).toMatchObject({
        signature: 'number',
        requirement: 'required',
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
