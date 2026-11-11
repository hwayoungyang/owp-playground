import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { componentRuntimeDefaults } from '../scripts/components-runtime-defaults';
import { documentedDefault } from '../scripts/components-api-default-docs';
import { verifiedComponentDefaults } from '../scripts/components-verified-defaults';

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe('공개 Props 기본값의 실제 근거', () => {
  it('검토한 DataGrid 버전과 세 구현 파일이 일치할 때만 export 기본값을 보완한다', () => {
    const root = mkdtempSync(join(tmpdir(), 'owp-verified-defaults-'));
    directories.push(root);
    const installed = fileURLToPath(new URL('../node_modules/@owp/datagrid/', import.meta.url));
    const installedRoot = fileURLToPath(new URL('..', import.meta.url));
    const installedPackage: unknown = JSON.parse(
      readFileSync(join(installed, 'package.json'), 'utf8'),
    );
    const declaredPackage: unknown = JSON.parse(
      readFileSync(join(installedRoot, 'package.json'), 'utf8'),
    );
    expect(declaredPackage).toMatchObject({ dependencies: { '@owp/datagrid': '4.0.2' } });
    expect(installedPackage).toMatchObject({ version: '4.0.2' });
    const expected = {
      OwpDataGridExportExcelButton: {
        exportName: '"sheet"',
        useAppendCurrentDateTimeToExportName: 'false',
        saveMode: '"auto"',
      },
    };
    const supportedVersions = ['4.0.2'] as const;
    expect(verifiedComponentDefaults(installedRoot, 'datagrid', '4.0.2')).toEqual(expected);
    // 같은 기능 계약이어도 이전 버전의 index 지문을 새 버전으로 대체하지 않습니다.
    for (const version of ['4.0.0', '4.0.1'])
      expect(verifiedComponentDefaults(installedRoot, 'datagrid', version), version).toEqual({});
    const packageRoot = join(root, 'node_modules/@owp/datagrid');
    const files = ['dist/index.js', 'dist/chunks/C8z2ndwY.js', 'dist/chunks/COyRmcMd.js'];
    const fingerprints = [
      'ef72d50068fc60bda6590ca205b912c32fcfd07cb3dd0bfc0481ff5640c92623',
      'de83161ff79c79adf5093200a3b857248ef5ad4cb15fe396c296ac1e68e90afd',
      '3273e18e07abb024b1d2c97915f050b42345b7bd276d5b36e351fedf5732e5d9',
    ];
    expect(
      files.map((file) =>
        createHash('sha256')
          .update(readFileSync(join(installed, file)))
          .digest('hex'),
      ),
    ).toEqual(fingerprints);
    for (const relative of files) {
      const file = join(packageRoot, relative);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, readFileSync(join(installed, relative)));
    }
    for (const version of supportedVersions) {
      expect(verifiedComponentDefaults(root, 'datagrid', version), version).toEqual(expected);
      expect(verifiedComponentDefaults(root, 'core', version), version).toEqual({});
    }
    for (const version of ['3.5.4', '3.5.5', '4.0.3', '5.0.0', '__proto__', 'toString']) {
      expect(verifiedComponentDefaults(root, 'datagrid', version)).toEqual({});
    }
    for (const relative of files) {
      const file = join(packageRoot, relative);
      const original = readFileSync(file);
      writeFileSync(file, Buffer.concat([original, Buffer.from('\n// changed\n')]));
      for (const version of supportedVersions) {
        expect(
          verifiedComponentDefaults(root, 'datagrid', version),
          `${version}: ${relative}`,
        ).toEqual({});
      }
      writeFileSync(file, original);
      rmSync(file);
      for (const version of supportedVersions) {
        expect(
          verifiedComponentDefaults(root, 'datagrid', version),
          `${version}: ${relative}`,
        ).toEqual({});
      }
      writeFileSync(file, original);
    }
    for (const version of supportedVersions) {
      expect(verifiedComponentDefaults(root, 'datagrid', version), version).toEqual(expected);
    }
  });

  it('모듈 실행 없이 re-export·wrapper의 구조 분해 기본값을 추적한다', () => {
    // Given: 실행하면 오류가 나는 모듈과 props를 전달하는 wrapper
    const root = mkdtempSync(join(tmpdir(), 'owp-prop-defaults-'));
    directories.push(root);
    writeFileSync(join(root, 'defaults.js'), 'export const enabled = !0;');
    writeFileSync(
      join(root, 'button.js'),
      `
      import { enabled as flag } from './defaults.js';
      throw new Error('Do not execute documentation inputs');
      const shaded = 99;
      let changing = 1;
      changing = 2;
      const mutated = [];
      mutated.push(1);
      const Inner = (props, undefined) => {
        let { enabled = flag, count = 3, scope = 'visible', items = [], dynamic = readWindow(), label = 'default', limit: shaded, dependent = shaded, mutable = changing, aggregate = mutated, shadowedGlobal = undefined } = props;
        const value = props.value ?? 0;
        if (props.kind === 'other') { const onlyHere = props.conditional ?? 9; }
        const callback = props => { const nested = props.nested ?? 7; };
        return null;
      };
      const Wrapped = forwardRef((props, ref) => jsx(Inner, { ...props, label: 'fixed', ref }));
      export { Wrapped as Button };
    `,
    );
    writeFileSync(join(root, 'index.js'), "export { Button } from './button.js';");
    // When: 선언에 사용할 정적 기본값만 읽는다.
    const defaults = componentRuntimeDefaults([join(root, 'index.js')])('Button');
    // Then: 직접 확인한 기본값만 제공하고 덮어쓴 값·조건부 값·실행 결과는 제외한다.
    expect(Object.fromEntries([...defaults].map(([name, info]) => [name, info.value]))).toEqual({
      enabled: 'true',
      count: '3',
      scope: '"visible"',
      items: '[]',
      value: '0',
    });
    expect(defaults.get('scope')?.file).toBe(join(root, 'button.js'));
    expect(defaults.get('scope')?.line).toBeGreaterThan(0);
  });

  it.each([
    ['합계행 포함 여부. 기본값 true', 'boolean | undefined', 'true'],
    ['기본값: `0`', 'number', '0'],
    ['Defaults to "small".', 'string', '"small"'],
    ['기본값 visible', '"visible" | "all"', '"visible"'],
    [
      '모서리 곡률. MUI/default 기본값 true, dataGrid 기본값 false.',
      'number | boolean | undefined',
      'MUI/default: true · dataGrid: false',
    ],
    ['기본값은 theme에서 결정', 'string', null],
    ['선택 사항', 'boolean | undefined', null],
  ])('명시된 기본값만 해석한다: %s', (description, type, expected) => {
    // Given/When/Then: 설명에 실제로 적힌 값과 공개 타입을 대조한다.
    expect(documentedDefault(description, type)).toBe(expected);
  });
});
