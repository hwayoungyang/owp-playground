import ts from 'typescript-compiler-api';
import { symbolDeclaration } from './components-api-compiler.ts';

export function documentation(checker: ts.TypeChecker, symbol: ts.Symbol): string {
  return ts.displayPartsToString(symbol.getDocumentationComment(checker));
}

export function tagText(tags: readonly ts.JSDocTagInfo[], name: string): string {
  return tags
    .filter((tag) => tag.name === name)
    .map((tag) => ts.displayPartsToString(tag.text))
    .join('\n');
}

export function parameterDocumentation(tags: readonly ts.JSDocTagInfo[], name: string): string {
  return tags
    .filter((tag) => tag.name === 'param')
    .flatMap((tag) => {
      const text = ts.displayPartsToString(tag.text);
      const match = text.match(/^([\w.$]+)\s*(?:-\s*)?([\s\S]*)$/);
      return match?.[1] === name ? [match[2] ?? ''] : [];
    })
    .join('\n');
}

export function declarationText(symbol: ts.Symbol): string {
  return (symbol.declarations ?? [symbolDeclaration(symbol)])
    .map((declaration) => {
      if (ts.isVariableDeclaration(declaration)) return `declare const ${declaration.getText()};`;
      return declaration.getText();
    })
    .join('\n\n');
}

export function readableType(checker: ts.TypeChecker, type: ts.Type, location: ts.Node): string {
  return checker.typeToString(
    type,
    location,
    ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
  );
}

export function memberSource(declaration: ts.Declaration): string {
  const file = declaration.getSourceFile().fileName.replaceAll('\\', '/');
  const packages = [...file.matchAll(/\/node_modules\/((?:@[^/]+\/)?[^/]+)/g)];
  const packageName = packages.at(-1)?.[1] ?? 'TypeScript';
  if (packageName === '@owp/components') return packageName;
  let owner: ts.Node | undefined = declaration.parent;
  while (owner && !ts.isSourceFile(owner)) {
    if (
      (ts.isInterfaceDeclaration(owner) ||
        ts.isTypeAliasDeclaration(owner) ||
        ts.isClassDeclaration(owner)) &&
      owner.name
    )
      return `${packageName} · ${owner.name.text}`;
    owner = owner.parent;
  }
  return packageName;
}
