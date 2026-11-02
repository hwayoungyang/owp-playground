import ts from 'typescript-compiler-api';
import { RuntimeModules } from './components-runtime-modules.ts';
import type { RuntimeReference } from './components-runtime-modules.ts';
import { runtimeLiteral } from './components-runtime-literals.ts';

export type RuntimeDefault = { readonly value: string; readonly file: string; readonly line: number };

export function componentRuntimeDefaults(entryPoints: readonly string[]) {
  const modules = new RuntimeModules();
  return (name: string): ReadonlyMap<string, RuntimeDefault> => {
    const values = new Map<string, RuntimeDefault>();
    const seen = new Set<ts.Node>();
    const collect = (reference: RuntimeReference, omitted = new Set<string>()) => {
      const resolved = ts.isIdentifier(reference.node) ? modules.identifier(reference) : reference;
      if (!resolved || seen.has(resolved.node)) return;
      const { source, node } = resolved;
      seen.add(node);
      const add = (name: string, expression: ts.Expression) => {
        const value = runtimeLiteral(modules, { source, node: expression });
        if (value !== null && !omitted.has(name) && !values.has(name)) values.set(name, { value, file: source.fileName, line: source.getLineAndCharacterOfPosition(expression.getStart(source)).line + 1 });
      };
      const defaults = modules.defaultProps(resolved);
      if (defaults) for (const property of defaults.properties)
        if (ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) add(property.name.text, property.initializer);
      if (ts.isCallExpression(node)) {
        for (const argument of node.arguments) if (ts.isArrowFunction(argument) || ts.isFunctionExpression(argument) || ts.isIdentifier(argument)) collect({ source, node: argument }, omitted);
        return;
      }
      if (!ts.isArrowFunction(node) && !ts.isFunctionExpression(node) && !ts.isFunctionDeclaration(node)) return;
      const parameter = node.parameters[0];
      if (!parameter || !node.body) return;
      const bindings = (pattern: ts.ObjectBindingPattern) => {
        for (const element of pattern.elements) if (element.initializer) {
          const key = element.propertyName ?? element.name;
          if (ts.isIdentifier(key) || ts.isStringLiteral(key)) add(key.text, element.initializer);
        }
      };
      if (ts.isObjectBindingPattern(parameter.name)) bindings(parameter.name);
      const props = ts.isIdentifier(parameter.name) ? parameter.name.text : undefined;
      const visit = (child: ts.Node) => {
        if (ts.isFunctionLike(child)) return;
        if (ts.isIfStatement(child) || ts.isConditionalExpression(child) || ts.isSwitchStatement(child)) return;
        if (ts.isForStatement(child) || ts.isForOfStatement(child) || ts.isForInStatement(child) || ts.isWhileStatement(child) || ts.isTryStatement(child)) return;
        if (ts.isBinaryExpression(child) && (child.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || child.operatorToken.kind === ts.SyntaxKind.BarBarToken)) return;
        if (props && ts.isVariableDeclaration(child) && ts.isObjectBindingPattern(child.name) && child.initializer && ts.isIdentifier(child.initializer) && child.initializer.text === props) bindings(child.name);
        if (props && ts.isBinaryExpression(child) && child.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken && ts.isPropertyAccessExpression(child.left) && ts.isIdentifier(child.left.expression) && child.left.expression.text === props) add(child.left.name.text, child.right);
        if (props && ts.isCallExpression(child)) {
          const forwarded = child.arguments.find((argument) => ts.isObjectLiteralExpression(argument) && argument.properties.some((property) => ts.isSpreadAssignment(property) && ts.isIdentifier(property.expression) && property.expression.text === props));
          const component = child.arguments[0];
          if (forwarded && ts.isObjectLiteralExpression(forwarded) && component && ts.isIdentifier(component)) {
            const overrides = forwarded.properties.flatMap((property) => ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? [property.name.text] : []);
            collect({ source, node: component }, new Set([...omitted, ...overrides]));
          }
        }
        ts.forEachChild(child, visit);
      };
      visit(node.body);
    };
    for (const path of entryPoints) {
      const reference = modules.export(path, name);
      if (reference) { collect(reference); break; }
    }
    return values;
  };
}
