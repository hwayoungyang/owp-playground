import ts from 'typescript-compiler-api';
import type {
  ComponentsApiData,
  ComponentsApiEntry,
  ComponentsApiGroup,
} from '../src/playgrounds/components/api/types.ts';
import { componentsCatalog } from '../src/playgrounds/components/catalog.ts';
import { componentCatalog } from '../src/playgrounds/components/model/componentCatalog.ts';
import { hookCatalog } from '../src/playgrounds/components/model/hookCatalog.ts';
import { utilCatalog } from '../src/playgrounds/components/model/utilCatalog.ts';
import {
  ComponentsApiError,
  createComponentsApiCompiler,
  requirePublicSymbol,
  symbolDeclaration,
} from './components-api-compiler.ts';
import { referencedPublicTypes, supportingType } from './components-api-related.ts';
import { callableSignatures, readPropsVariants, readSignatures } from './components-api-shapes.ts';
import { declarationText, documentation, readableType } from './components-api-text.ts';

export type ComponentsApiCatalogSymbol = {
  readonly name: string;
  readonly group: ComponentsApiGroup;
};

export type ComponentsApiProjection = {
  readonly data: ComponentsApiData;
  readonly watchFiles: readonly string[];
};

const catalogSymbols: readonly ComponentsApiCatalogSymbol[] = [
  ...componentCatalog.flatMap((entry) =>
    entry.api.map((name) => ({ name, group: 'components' as const })),
  ),
  ...hookCatalog.flatMap((entry) => entry.api.map((name) => ({ name, group: 'hooks' as const }))),
  ...utilCatalog.flatMap((entry) => entry.api.map((name) => ({ name, group: 'utils' as const }))),
];

export function readComponentsApiProjection(
  root: string,
  catalog: readonly ComponentsApiCatalogSymbol[] = catalogSymbols,
): ComponentsApiProjection {
  const compiler = createComponentsApiCompiler(root);
  const entries = new Map<string, ComponentsApiEntry>();
  const related = new Map<string, ReturnType<typeof supportingType>>();
  for (const { name, group } of catalog) {
    const existing = entries.get(name);
    if (existing) {
      if (existing.group !== group)
        throw new ComponentsApiError(`${name}의 catalog 분류가 모호합니다.`);
      continue;
    }
    const exported = requirePublicSymbol(compiler, name);
    const { symbol } = exported;
    const declaration = symbolDeclaration(symbol);
    const type = compiler.checker.getTypeOfSymbolAtLocation(symbol, declaration);
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown))
      throw new ComponentsApiError(`${name}의 공개 타입을 해석할 수 없습니다.`);
    const callable = callableSignatures(type).length > 0;
    const kind =
      group === 'components'
        ? 'component'
        : group === 'hooks'
          ? 'hook'
          : callable
            ? 'function'
            : 'value';
    if (kind === 'hook' && !callable)
      throw new ComponentsApiError(`${name}의 hook signature를 해석할 수 없습니다.`);
    const publicTypes = referencedPublicTypes(compiler, symbol, kind === 'component');
    for (const type of publicTypes) related.set(type.name, supportingType(compiler, type));
    entries.set(name, {
      id: `@owp/components:${name}`,
      name,
      group,
      kind,
      imports: exported.imports.map((module) => `import { ${name} } from '${module}';`),
      description: documentation(compiler.checker, symbol),
      declaration: declarationText(symbol),
      propsVariants: kind === 'component' ? readPropsVariants(compiler.checker, symbol) : [],
      signatures:
        kind === 'hook' || kind === 'function' ? readSignatures(compiler.checker, symbol) : [],
      valueType: kind === 'value' ? readableType(compiler.checker, type, declaration) : null,
      relatedTypeIds: publicTypes.map((type) => `@owp/components:${type.name}`),
      exampleIds: componentsCatalog
        .filter((entry) => entry.api.includes(name))
        .map((entry) => entry.id),
    });
  }
  return {
    data: {
      packageVersion: compiler.packageVersion,
      entries: [...entries.values()],
      supportingTypes: [...related.values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    },
    watchFiles: compiler.watchFiles,
  };
}

export function readComponentsApiData(root: string): ComponentsApiData {
  return readComponentsApiProjection(root).data;
}
