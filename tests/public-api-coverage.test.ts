import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readPublicApiPackage } from '../scripts/public-api-data';
import { createComponentsApiCompiler } from '../scripts/components-api-compiler';
import { createRequire } from 'node:module';
import { publicApiPackageIds } from '../src/features/public-api/types';
import { formatApiDescription } from '../src/shared/i18n/reference-copy';
import { protectedText } from '../src/shared/i18n/reference-copy-patterns';
import { publicApiWrapper } from '../src/features/public-api/wrapper-policy';
import { publicApiNavigationGroup } from '../src/features/public-api/grouping';

const root = fileURLToPath(new URL('..', import.meta.url));
const sentenceEndings = /(?:니다|세요|한다|된다|는다|이다|하다|운다)(?=[.!?](?:\s|$)|$)/g;

describe('설치본의 Playground 공개 API', () => {
  it.each(publicApiPackageIds)(
    '%s의 래퍼 대체 API를 제외한 루트·subpath·타입·값을 표시한다',
    (id) => {
      // Given: 설치된 선언에서 독립적으로 조회한 public symbol과 import 경로
      const compiler = createComponentsApiCompiler(root, `@owp/${id}`);
      const expected = [...compiler.exports]
        .filter(([name]) => !publicApiWrapper(id, name))
        .flatMap(([name, records]) =>
          records.flatMap((record) => record.imports.map((module) => `${module}#${name}`)),
        )
        .sort();
      if (id === 'core') {
        const require = createRequire(new URL('../package.json', import.meta.url));
        const nodeExports: unknown = require('@owp/core/vite/owpCoreAssetsPlugin.cjs');
        if (!nodeExports || typeof nodeExports !== 'object')
          throw new TypeError('Missing public Node exports');
        expected.push(
          ...Object.keys(nodeExports).map(
            (name) => `@owp/core/vite/owpCoreAssetsPlugin.cjs#${name}`,
          ),
        );
        expected.sort();
      }
      // When: 화면 projection을 구성한다.
      const data = readPublicApiPackage(root, id);
      if (id === 'core') {
        for (const name of [
          'I18nextProvider',
          'useTranslation',
          'QueryClientProvider',
          'useQuery',
          'useSuspenseQuery',
          'useMutation',
          'queryOptions',
        ])
          expect(
            data.entries.some((entry) => entry.name === name),
            name,
          ).toBe(false);
        for (const name of [
          'OwpCoreProvider',
          'OwpI18nProvider',
          'createOwpApiHooks',
          'useQueryClient',
          'QueryClient',
          'initOwpI18n',
          'UseTranslationResponse',
          'UseQueryOptions',
        ])
          expect(
            data.entries.some((entry) => entry.name === name),
            name,
          ).toBe(true);
        const components = data.entries.filter((entry) => entry.kind === 'component');
        const namesInGroup = (group: string) =>
          components
            .filter((entry) => publicApiNavigationGroup(entry) === group)
            .map((entry) => entry.name);
        expect(namesInGroup('core-providers')).toEqual([
          'OwpAppProvider',
          'OwpCoreProvider',
          'OwpI18nProvider',
          'OwpStoreProvider',
          'OwpStyleProvider',
          'OwpUiProvider',
        ]);
        expect(namesInGroup('core-inputs')).toEqual([
          'OwpCommonCodeQuerySelector',
          'OwpCommonCodeRadioGroup',
          'OwpCommonCodeSelector',
          'OwpLanguageSwitcherSelect',
          'OwpQuerySelector',
        ]);
        expect(namesInGroup('core-layout')).toEqual(['OwpLayout']);
        expect(namesInGroup('core-errors')).toEqual([
          'OwpErrorStatusPage',
          'OwpRouteErrorElement',
          'QueryErrorResetBoundary',
        ]);
        expect(namesInGroup('core-translation')).toEqual(['Trans']);
        expect(namesInGroup('components')).toEqual([]);
        const storageKeys = data.entries.find((entry) => entry.name === 'STORAGE_KEYS');
        expect(storageKeys).toMatchObject({ kind: 'value', group: 'constants' });
        expect(storageKeys?.modules).toContain('@owp/core/constants');
        expect(data.entries.find((entry) => entry.name === 'LOCAL_STORAGE_KEYS')?.group).toBe(
          'constants',
        );
        expect(data.entries.find((entry) => entry.name === 'currentSettingsAtom')?.group).toBe(
          'values',
        );
      }
      // Then: 공개 경로별 export가 하나도 누락되지 않고 상세·사용 예제를 제공한다.
      const actual = data.entries
        .filter((entry) => entry.kind !== 'asset')
        .flatMap((entry) => entry.modules.map((module) => `${module}#${entry.name}`))
        .sort();
      expect(actual).toEqual(expected);
      expect(new Set(data.entries.map((entry) => entry.id)).size).toBe(data.entries.length);
      for (const entrypoint of data.entrypoints)
        expect(
          data.entries.some((entry) => entry.modules.includes(entrypoint.name)),
          entrypoint.name,
        ).toBe(true);
      if (id === 'datagrid') {
        const button = data.entries.find((entry) => entry.name === 'OwpDataGridExportExcelButton');
        expect(button?.kind).toBe('component');
        expect(
          button?.propsVariants.some((variant) =>
            variant.props.some(
              (member) => member.name === 'api' && member.requirement === 'required',
            ),
          ),
        ).toBe(true);
        expect(button?.examples[0]?.id).toBe('excel');
        expect(button?.propsVariants.map((variant) => variant.label)).toEqual([
          'Grid ref 연결',
          'Grid API 연결',
        ]);
        for (const variant of button?.propsVariants ?? []) {
          const defaults = Object.fromEntries(
            variant.props.map((prop) => [prop.name, prop.defaultValue]),
          );
          expect(defaults).toMatchObject({
            scope: '"visible"',
            includeSummaryRows: 'true',
            includePinnedBottomRows: 'true',
            autoFilter: 'true',
            exportName: '"sheet"',
            useAppendCurrentDateTimeToExportName: 'false',
            saveMode: '"auto"',
          });
        }
        const hook = data.entries.find((entry) => entry.name === 'useDataGridApi');
        expect(hook?.kind).toBe('hook');
        expect(
          hook?.signatures.some((signature) =>
            signature.returnMembers.some((member) => member.name === 'getRows'),
          ),
        ).toBe(true);
      }
      if (id === 'core') {
        const queryKeys = data.entries.filter((entry) => entry.name === 'QueryKey');
        expect(new Set(queryKeys.map((entry) => entry.label)).size).toBe(queryKeys.length);
        const queryClient = data.entries.find((entry) => entry.name === 'useQueryClient');
        const members =
          queryClient?.signatures.flatMap((signature) => signature.returnMembers) ?? [];
        expect(members.some((member) => member.name === 'getQueryData')).toBe(true);
        expect(members.some((member) => member.name === '#private')).toBe(false);
      }
      if (id === 'charts')
        for (const name of ['Chart', 'Scale'])
          expect(data.entries.find((entry) => entry.name === name)?.kind).toBe('type');
      if (id === 'date-picker')
        expect(data.entries.find((entry) => entry.name === 'Dayjs')?.kind).toBe('type');
      if (id === 'components')
        expect(data.entries.find((entry) => entry.name === 'useOwpTranslation')?.kind).toBe('hook');
      for (const entry of data.entries) {
        expect(new Set(entry.propsVariants.map((variant) => variant.label)).size, entry.name).toBe(
          entry.propsVariants.length,
        );
        expect(
          entry.propsVariants.some((variant) => /^Props \d+$/.test(variant.label)),
          entry.name,
        ).toBe(false);
        expect(entry.declaration.length, entry.name).toBeGreaterThan(0);
        expect(entry.usage.length, entry.name).toBeGreaterThan(0);
        if (entry.kind === 'component' && entry.propsVariants.length === 0)
          expect(entry.declaration, entry.name).toMatch(/\(\s*\)/);
        if (entry.kind === 'hook' || entry.kind === 'function' || entry.kind === 'class')
          expect(entry.signatures.length, entry.name).toBeGreaterThan(0);
        const descriptions = [
          entry.description,
          ...entry.propsVariants.flatMap((variant) =>
            variant.props.map((prop) => prop.description),
          ),
          ...entry.signatures.flatMap((signature) => [
            signature.returnDescription,
            ...signature.parameters.map((parameter) => parameter.description),
            ...signature.returnMembers.map((member) => member.description),
            ...signature.parameterMembers.flatMap((parameter) =>
              parameter.members.map((member) => member.description),
            ),
          ]),
        ];
        for (const description of descriptions) {
          const result = formatApiDescription(description);
          expect(result.match(sentenceEndings), entry.id).toEqual(
            description.match(sentenceEndings),
          );
          expect(result.match(protectedText), entry.id).toEqual(description.match(protectedText));
          // 한국어 기술 용어에서 바뀐 표기를 제외하고 기존 식별자의 철자와 순서를 검사합니다.
          const identifiers = (text: string) =>
            (text.match(/[A-Za-z_$][\w$]*(?:[.-][A-Za-z_$][\w$]*)*/g) ?? []).filter(
              (token) => !['cache', 'Tooltip', 'series', 'public'].includes(token),
            );
          const familiarTerms = description
            .replaceAll('접두사', 'prefix')
            .replaceAll('접미사', 'suffix');
          expect(identifiers(result), entry.id).toEqual(identifiers(familiarTerms));
          expect(result.match(/-?\d+(?:\.\d+)?/g), entry.id).toEqual(
            description.match(/-?\d+(?:\.\d+)?/g),
          );
        }
      }
      if (process.env.OWP_PUBLIC_API_AUDIT_DIR)
        writeFileSync(`${process.env.OWP_PUBLIC_API_AUDIT_DIR}/${id}.json`, JSON.stringify(data));
      console.info(id, data.entries.length, 'public entries');
    },
    60_000,
  );
});
