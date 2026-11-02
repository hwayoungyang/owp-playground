import ts from 'typescript-compiler-api';
import type { ComponentsApiSupportingType } from '../src/playgrounds/components/api/types.ts';
import type { ComponentsApiCompiler, PublicSymbol } from './components-api-compiler.ts';
import { canonicalSymbol, symbolDeclaration } from './components-api-compiler.ts';
import { componentPropsTypes } from './components-api-shapes.ts';
import { declarationText, documentation } from './components-api-text.ts';

export function referencedPublicTypes(
  compiler: ComponentsApiCompiler,
  symbol: ts.Symbol,
  component: boolean,
): readonly PublicSymbol[] {
  const found = new Map<ts.Symbol, PublicSymbol>();
  const visited = new Set<ts.Node>();
  const inspect = (node: ts.Node): void => {
    if (visited.has(node)) return;
    visited.add(node);
    if (ts.isTypeReferenceNode(node) || ts.isExpressionWithTypeArguments(node)) {
      const reference = compiler.checker.getSymbolAtLocation(
        ts.isTypeReferenceNode(node) ? node.typeName : node.expression,
      );
      if (reference) {
        const canonical = canonicalSymbol(compiler.checker, reference);
        const exported = compiler.publicTypes.get(canonical);
        if (exported && canonical !== symbol) found.set(canonical, exported);
      }
    }
    ts.forEachChild(node, inspect);
  };
  for (const declaration of symbol.declarations ?? [symbolDeclaration(symbol)])
    inspect(declaration);
  if (component)
    for (const props of componentPropsTypes(compiler.checker, symbol)) {
      const alias =
        props.aliasSymbol &&
        compiler.publicTypes.get(canonicalSymbol(compiler.checker, props.aliasSymbol));
      if (alias) found.set(alias.symbol, alias);
      for (const property of props.getProperties())
        for (const declaration of property.declarations ?? []) inspect(declaration);
    }
  return [...found.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function supportingType(
  compiler: ComponentsApiCompiler,
  exported: PublicSymbol,
): ComponentsApiSupportingType {
  return {
    id: `@owp/components:${exported.name}`,
    name: exported.name,
    imports: exported.imports.map((module) => `import type { ${exported.name} } from '${module}';`),
    description: documentation(compiler.checker, exported.symbol),
    declaration: declarationText(exported.symbol),
  };
}
