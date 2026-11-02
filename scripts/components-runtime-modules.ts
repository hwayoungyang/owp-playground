import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript-compiler-api';

export type RuntimeReference = { readonly source: ts.SourceFile; readonly node: ts.Node };
type Binding = { readonly node: ts.Node } | { readonly module: string; readonly name: string };
type RuntimeModule = {
  readonly source: ts.SourceFile;
  readonly bindings: Map<string, Binding>;
  readonly exports: Map<string, Binding>;
  readonly stars: string[];
  readonly defaults: Map<string, ts.ObjectLiteralExpression>;
};

function binds(name: ts.BindingName, target: string): boolean {
  return ts.isIdentifier(name) ? name.text === target : name.elements.some((element) => ts.isBindingElement(element) && binds(element.name, target));
}

function locallyBound(identifier: ts.Identifier): boolean {
  let parent = identifier.parent;
  while (parent && !ts.isSourceFile(parent)) {
    if (ts.isFunctionLike(parent) && parent.parameters.some((parameter) => binds(parameter.name, identifier.text))) return true;
    if (ts.isBlock(parent) && parent.statements.some((statement) => ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.some((declaration) => binds(declaration.name, identifier.text))
      : (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name?.text === identifier.text)) return true;
    parent = parent.parent;
  }
  return false;
}

/** 설치된 ESM의 export·import와 별칭만 추적하며 모듈을 실행하지 않습니다. */
export class RuntimeModules {
  private readonly modules = new Map<string, RuntimeModule>();

  private read(path: string): RuntimeModule {
    const cached = this.modules.get(path);
    if (cached) return cached;
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const module: RuntimeModule = { source, bindings: new Map(), exports: new Map(), stars: [], defaults: new Map() };
    this.modules.set(path, module);
    const external = (specifier: ts.Expression, name: string): Binding => ({ module: ts.isStringLiteral(specifier) ? specifier.text : '', name });
    for (const statement of source.statements) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations)
          if (ts.isIdentifier(declaration.name) && declaration.initializer) {
            const binding = { node: declaration.initializer };
            module.bindings.set(declaration.name.text, binding);
            if (statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) module.exports.set(declaration.name.text, binding);
          }
      } else if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name) {
        const binding = { node: statement };
        module.bindings.set(statement.name.text, binding);
        if (statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) module.exports.set(statement.name.text, binding);
      } else if (ts.isImportDeclaration(statement)) {
        const clause = statement.importClause;
        if (clause?.name) module.bindings.set(clause.name.text, external(statement.moduleSpecifier, 'default'));
        if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings))
          for (const element of clause.namedBindings.elements) module.bindings.set(element.name.text, external(statement.moduleSpecifier, (element.propertyName ?? element.name).text));
      } else if (ts.isExportDeclaration(statement)) {
        if (statement.exportClause && ts.isNamedExports(statement.exportClause))
          for (const element of statement.exportClause.elements) module.exports.set(element.name.text,
            statement.moduleSpecifier ? external(statement.moduleSpecifier, (element.propertyName ?? element.name).text) : { node: element.propertyName ?? element.name });
        else if (statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) module.stars.push(statement.moduleSpecifier.text);
      } else if (ts.isExportAssignment(statement)) module.exports.set('default', { node: statement.expression });
      else if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)) {
        const { left, right, operatorToken } = statement.expression;
        if (operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(left) && left.name.text === 'defaultProps' && ts.isIdentifier(left.expression) && ts.isObjectLiteralExpression(right)) module.defaults.set(left.expression.text, right);
      }
    }
    return module;
  }

  private follow(source: ts.SourceFile, binding: Binding | undefined, seen: Set<string>): RuntimeReference | undefined {
    if (!binding) return undefined;
    if ('node' in binding) return ts.isIdentifier(binding.node) ? this.identifier({ source, node: binding.node }, seen) : { source, node: binding.node };
    return binding.module.startsWith('.') ? this.export(resolve(dirname(source.fileName), binding.module), binding.name, seen) : undefined;
  }

  export(path: string, name: string, seen = new Set<string>()): RuntimeReference | undefined {
    const key = `${path}#${name}`;
    if (seen.has(key)) return undefined;
    seen.add(key);
    const module = this.read(path);
    const direct = this.follow(module.source, module.exports.get(name), seen);
    if (direct) return direct;
    for (const star of module.stars) if (star.startsWith('.')) {
      const found = this.export(resolve(dirname(path), star), name, seen);
      if (found) return found;
    }
    return undefined;
  }

  identifier(reference: RuntimeReference, seen = new Set<string>()): RuntimeReference | undefined {
    if (!ts.isIdentifier(reference.node)) return reference;
    if (locallyBound(reference.node)) return undefined;
    const key = `${reference.source.fileName}:${reference.node.text}`;
    if (seen.has(key)) return undefined;
    seen.add(key);
    return this.follow(reference.source, this.read(reference.source.fileName).bindings.get(reference.node.text), seen);
  }

  isUnbound(reference: RuntimeReference): boolean {
    return ts.isIdentifier(reference.node) && !locallyBound(reference.node) && !this.read(reference.source.fileName).bindings.has(reference.node.text);
  }

  defaultProps(reference: RuntimeReference): ts.ObjectLiteralExpression | undefined {
    const module = this.read(reference.source.fileName);
    for (const [name, object] of module.defaults) {
      const target = this.identifier({ source: reference.source, node: ts.factory.createIdentifier(name) });
      if (target?.node === reference.node) return object;
    }
    return undefined;
  }
}
