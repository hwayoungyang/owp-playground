import ts from 'typescript-compiler-api';
import type { RuntimeModules, RuntimeReference } from './components-runtime-modules.ts';

export function runtimeLiteral(modules: RuntimeModules, reference: RuntimeReference, seen = new Set<ts.Node>()): string | null {
  const { source, node } = reference;
  if (seen.has(node)) return null;
  seen.add(node);
  if (ts.isParenthesizedExpression(node)) return runtimeLiteral(modules, { source, node: node.expression }, seen);
  if (ts.isStringLiteralLike(node)) return JSON.stringify(node.text);
  if (ts.isNumericLiteral(node)) return String(Number(node.text));
  if (node.kind === ts.SyntaxKind.TrueKeyword) return 'true';
  if (node.kind === ts.SyntaxKind.FalseKeyword) return 'false';
  if (node.kind === ts.SyntaxKind.NullKeyword) return 'null';
  if (ts.isVoidExpression(node) && ts.isNumericLiteral(node.expression)) return 'undefined';
  if (ts.isIdentifier(node)) {
    if (['undefined', 'Infinity', 'NaN'].includes(node.text) && modules.isUnbound(reference)) return node.text;
    const resolved = modules.identifier(reference);
    if (!resolved) return null;
    const declaration = resolved.node.parent;
    if (declaration && ts.isVariableDeclaration(declaration) && !(declaration.parent.flags & ts.NodeFlags.Const)) return null;
    const value = runtimeLiteral(modules, resolved, seen);
    return value === '[]' || value === '{}' ? null : value;
  }
  if (ts.isPrefixUnaryExpression(node)) {
    const operand = runtimeLiteral(modules, { source, node: node.operand }, seen);
    if (operand === null) return null;
    if (node.operator === ts.SyntaxKind.ExclamationToken && ['0','1','true','false'].includes(operand)) return ['0','false'].includes(operand) ? 'true' : 'false';
    if (node.operator === ts.SyntaxKind.MinusToken && /^\d+(?:\.\d+)?$/.test(operand)) return `-${operand}`;
  }
  if (ts.isArrayLiteralExpression(node) && node.elements.length === 0) return '[]';
  if (ts.isObjectLiteralExpression(node) && node.properties.length === 0) return '{}';
  return null;
}
