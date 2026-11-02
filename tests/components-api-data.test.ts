import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { readComponentsApiData, readComponentsApiProjection } from '../scripts/components-api-data';
import type {
  ComponentsApiData,
  ComponentsApiEntry,
} from '../src/playgrounds/components/api/types';
import { componentsCatalog } from '../src/playgrounds/components/catalog';
import { componentCatalog } from '../src/playgrounds/components/model/componentCatalog';
import { hookCatalog } from '../src/playgrounds/components/model/hookCatalog';
import { utilCatalog } from '../src/playgrounds/components/model/utilCatalog';

const root = fileURLToPath(new URL('..', import.meta.url));
let data: ComponentsApiData;

function entry(name: string): ComponentsApiEntry {
  const found = data.entries.find((item) => item.name === name);
  if (!found) throw new TypeError(`Missing Components API entry: ${name}`);
  return found;
}

beforeAll(() => {
  data = readComponentsApiData(root);
}, 30_000);

describe('설치된 Components 공개 API projection', () => {
  it('카탈로그의 모든 symbol을 실제 공개 import와 소유 그룹으로 제공한다', () => {
    const groups = [
      { group: 'components', catalog: componentCatalog, count: 30 },
      { group: 'hooks', catalog: hookCatalog, count: 8 },
      { group: 'utils', catalog: utilCatalog, count: 12 },
    ] as const;
    const manifest = JSON.parse(
      readFileSync(
        new URL('../node_modules/@owp/components/package.json', import.meta.url),
        'utf8',
      ),
    );
    expect(data.packageVersion).toBe(manifest.version);
    expect(data.entries).toHaveLength(50);
    for (const { group, catalog, count } of groups) {
      const names = [...new Set(catalog.flatMap((item) => item.api))];
      expect(names).toHaveLength(count);
      expect(
        data.entries
          .filter((item) => item.group === group)
          .map((item) => item.name)
          .sort(),
      ).toEqual(names.sort());
      for (const name of names) {
        expect(entry(name).imports.length).toBeGreaterThan(0);
        expect(
          entry(name).imports.every((statement) =>
            statement.startsWith(`import { ${name} } from '@owp/components`),
          ),
        ).toBe(true);
        expect(entry(name).id).toBe(`@owp/components:${name}`);
      }
    }
  });

  it('inline exotic NumberField props와 실제 callback·ref를 해석한다', () => {
    const numberField = entry('OwpNumberField');
    const props = numberField.propsVariants.flatMap((variant) => variant.props);
    expect(props.find((prop) => prop.name === 'decimalScale')).toMatchObject({
      type: 'number | undefined',
      requirement: 'optional',
      defaultValue: null,
    });
    expect(props.find((prop) => prop.name === 'helperText')?.type).toContain('ReactNode');
    expect(props.find((prop) => prop.name === 'onValueChange')?.isCallback).toBe(true);
    expect(props.find((prop) => prop.name === 'ref')?.type).toContain('HTMLInputElement');
    expect(numberField.declaration).toContain('ForwardRefExoticComponent');
    expect(numberField.relatedTypeIds).not.toContain('@owp/components:OwpNumberFieldProps');
    expect(props.find((prop) => prop.name === 'inputAlign')?.source).toBe('@owp/components');
  });

  it('MUI Tab overload·styled Tabs·React class component props를 보존한다', () => {
    expect(entry('OwpTab').propsVariants).toHaveLength(3);
    expect(
      entry('OwpTab').propsVariants.every((variant) =>
        variant.props.some((prop) => prop.name === 'label'),
      ),
    ).toBe(true);
    expect(
      entry('OwpTabs')
        .propsVariants.flatMap((variant) => variant.props)
        .find((prop) => prop.name === 'variant'),
    ).toMatchObject({ defaultValue: "'owp'", requirement: 'optional' });
    expect(
      entry('OwpErrorBoundary')
        .propsVariants.flatMap((variant) => variant.props)
        .some((prop) => prop.name === 'children'),
    ).toBe(true);
    expect(entry('OwpErrorBoundary').declaration).toContain('class OwpErrorBoundary');
    expect(
      entry('OwpErrorBoundary')
        .propsVariants.flatMap((variant) => variant.props)
        .some((prop) => prop.name === 'ref'),
    ).toBe(false);
    expect(
      entry('OwpTab').propsVariants.map((variant) =>
        variant.props.some((prop) => prop.name === 'component'),
      ),
    ).toEqual([false, true, false]);
  });

  it('FieldTable의 layout·날짜 formatting branch에서 never를 허용 prop으로 합치지 않는다', () => {
    const variants = entry('OwpFieldTable').propsVariants;
    expect(variants).toHaveLength(4);
    for (const variant of variants) {
      const layout = variant.props.find((prop) => prop.name === 'layout');
      const cellLayout = variant.props.find((prop) => prop.name === 'cellLayout');
      expect([layout?.requirement, cellLayout?.requirement]).toContain('required');
      expect([layout?.requirement, cellLayout?.requirement]).toContain('unavailable');
    }
    expect(
      variants
        .map((variant) => variant.props.find((prop) => prop.name === 'dateFormatter')?.requirement)
        .sort(),
    ).toEqual(['required', 'required', 'unavailable', 'unavailable']);
    expect(
      variants.every(
        (variant) =>
          variant.props.find((prop) => prop.name === 'radius')?.defaultValue ===
          'MUI/default: true · dataGrid: false',
      ),
    ).toBe(true);
    expect(
      variants
        .filter(
          (variant) =>
            variant.props.find((prop) => prop.name === 'dateFormatter')?.requirement === 'required',
        )
        .every(
          (variant) => variant.props.find((prop) => prop.name === 'dateFormatter')?.isCallback,
        ),
    ).toBe(true);
  });

  it('hook·function signature와 상수 값을 구분하고 실제 /hooks helper import를 표시한다', () => {
    expect(entry('useMinimumVisibleState')).toMatchObject({
      kind: 'hook',
      propsVariants: [],
      valueType: null,
    });
    expect(entry('useMinimumVisibleState').signatures[0]).toMatchObject({
      returnType: 'boolean',
      parameters: [
        {
          name: 'visible',
          optional: true,
          rest: false,
          description: '원본 표시 상태',
          type: 'boolean | undefined',
        },
        {
          name: 'minDuration',
          optional: true,
          rest: false,
          description: '최소 표시 시간',
          type: 'number | undefined',
        },
      ],
    });
    expect(entry('mergeSx').signatures[0]?.parameters[0]?.rest).toBe(true);
    expect(entry('responsiveLayoutStyles')).toMatchObject({
      kind: 'value',
      propsVariants: [],
      signatures: [],
    });
    expect(entry('responsiveLayoutStyles').valueType).toContain('responsiveItemStyle');
    for (const name of ['getResponsiveDeviceByWidthClass', 'getResponsiveDeviceMediaQuery'])
      expect(entry(name).imports).toEqual([`import { ${name} } from '@owp/components/hooks';`]);
  });

  it('실제로 공개한 관련 타입만 연결하고 scenario·group 예제를 모두 연결한다', () => {
    for (const type of data.supportingTypes) {
      for (const statement of type.imports) {
        const module = statement.match(/from '@owp\/components(?:\/([^']+))?';/)?.[1] ?? 'index';
        const publicDeclaration = readFileSync(
          new URL(
            `../node_modules/@owp/components/dist/declarations/${module}.d.ts`,
            import.meta.url,
          ),
          'utf8',
        );
        expect(publicDeclaration).toMatch(new RegExp(`\\b${type.name}\\b`));
        expect(statement).toBe(`import type { ${type.name} } from '@owp/components/${module}';`);
      }
      expect(data.entries.some((item) => item.relatedTypeIds.includes(type.id))).toBe(true);
    }
    expect(data.supportingTypes.some((type) => type.name === 'OwpPageCardedRef')).toBe(true);
    expect(data.supportingTypes.some((type) => type.name === 'OwpSectionProps')).toBe(false);
    for (const item of data.entries)
      expect(item.exampleIds).toEqual(
        componentsCatalog
          .filter((example) => example.api.includes(item.name))
          .map((example) => example.id),
      );
    expect(entry('OwpNumberField').exampleIds).toContain('getting-started');
    expect(entry('OwpNumberField').exampleIds.length).toBeGreaterThan(1);
    expect(JSON.stringify(data)).not.toMatch(/\/Users\/|\.pnpm\/|\/chunks\//);
  });

  it('누락된 공개 export는 조용히 생략하지 않고 오류로 중단한다', () => {
    expect(() =>
      readComponentsApiProjection(root, [{ name: 'MissingPublicExport', group: 'components' }]),
    ).toThrow('공개 export가 없거나 모호합니다');
  });
});
