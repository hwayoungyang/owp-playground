import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import ts from 'typescript-compiler-api';
import type { PublicApiSignature } from '../src/features/public-api/types.ts';

/** 타입 선언이 없는 Core의 공개 Node 진입점은 실제 JavaScript signature를 표시합니다. */
export function readCoreNodeFunctions(root: string): ReadonlyMap<string, PublicApiSignature> {
  const require = createRequire(resolve(root, 'package.json'));
  const exported: unknown = require('@owp/core/vite/owpCoreAssetsPlugin.cjs');
  if (!exported || typeof exported !== 'object') throw new TypeError('Core Node exports must be an object');
  const result = new Map<string, PublicApiSignature>();
  for (const [name, value] of Object.entries(exported)) {
    if (typeof value !== 'function') continue;
    const text = Function.prototype.toString.call(value);
    const source = ts.createSourceFile('node-api.js', `const api = ${text};`, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const statement = source.statements[0];
    const initializer = statement && ts.isVariableStatement(statement) ? statement.declarationList.declarations[0]?.initializer : undefined;
    if (!initializer || (!ts.isArrowFunction(initializer) && !ts.isFunctionExpression(initializer))) throw new TypeError(`Cannot read Node API signature: ${name}`);
    result.set(name, {
      declaration: `${name}(${initializer.parameters.map((parameter) => parameter.getText(source)).join(', ')})`,
      parameters: initializer.parameters.map((parameter) => ({ name: parameter.name.getText(source), type: 'unknown', optional: Boolean(parameter.initializer || parameter.questionToken), rest: Boolean(parameter.dotDotDotToken), description: '' })),
      returnType: 'unknown', returnDescription: '', parameterMembers: [], returnMembers: [],
    });
  }
  return result;
}
