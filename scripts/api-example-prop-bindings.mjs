import path from 'node:path';
import { parseSync } from 'vite';

export const propKey = (node) => node?.name ?? (typeof node?.value === 'string' ? node.value : undefined);
const functions = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
const wrappers = new Set(['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression', 'ParenthesizedExpression', 'ChainExpression']);

export function walkPropNodes(node, visit) {
  if (!node || typeof node !== 'object' || typeof node.type !== 'string') return;
  visit(node);
  for (const [key, child] of Object.entries(node)) {
    if (['comments', 'typeAnnotation', 'typeParameters', 'returnType'].includes(key)) continue;
    if (Array.isArray(child)) child.forEach((entry) => walkPropNodes(entry, visit));
    else walkPropNodes(child, visit);
  }
}

/** 타입 대신 실제 초기값·import·함수 반환값을 추적합니다. */
export function createPropBindings(files) {
  const modules = files.filter((file) => /\.tsx?$/.test(file.file)).map((file) => {
    const parsed = parseSync(file.file, file.content);
    if (parsed.errors.length) throw new SyntaxError(`예제 prop 분석 실패: ${file.file}`);
    return { ...file, program: parsed.program, scopes: new WeakMap(), imports: new Map(), exports: new Map(), stars: [] };
  });
  const byPath = new Map(modules.map((module) => [module.file, module]));
  const dependency = (module, source) => {
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(module.file), source));
    return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
      .map((file) => byPath.get(file)).find(Boolean);
  };
  function bindPattern(pattern, value, scope, keys = [], omit = []) {
    if (pattern.type === 'AssignmentPattern') return bindPattern(pattern.left, value, scope, keys, omit);
    if (pattern.type === 'Identifier') scope.bindings.set(pattern.name, { ...value, keys, omit });
    if (pattern.type === 'ObjectPattern') for (const property of pattern.properties) {
      if (property.type === 'RestElement') bindPattern(property.argument, value, scope, keys,
        pattern.properties.filter((entry) => entry.type === 'Property').map((entry) => propKey(entry.key)));
      else if (!property.computed || property.key.type === 'Literal') {
        bindPattern(property.value, value, scope, [...keys, propKey(property.key)]);
      }
    }
    if (pattern.type === 'ArrayPattern') for (const element of pattern.elements) {
      if (element) bindPattern(element, { node: null }, scope);
    }
  }
  for (const module of modules) {
    module.root = { bindings: new Map(), parent: null };
    function index(node, scope) {
      if (!node || typeof node !== 'object' || typeof node.type !== 'string') return;
      if (node.type === 'FunctionDeclaration' && node.id) scope.bindings.set(node.id.name, { node, module });
      if (functions.has(node.type)) {
        scope = { bindings: new Map(), parent: scope };
        for (const parameter of node.params) bindPattern(parameter, { node: null }, scope);
      } else if (node.type === 'BlockStatement') scope = { bindings: new Map(), parent: scope };
      module.scopes.set(node, scope);
      if (node.type === 'VariableDeclaration') for (const declaration of node.declarations) {
        bindPattern(declaration.id, { node: node.kind === 'const' ? declaration.init : null, module }, scope);
      }
      if (node.type === 'ImportDeclaration' && node.importKind !== 'type') for (const specifier of node.specifiers) {
        if (specifier.importKind === 'type') continue;
        const binding = { source: node.source.value, name: propKey(specifier.imported) ?? (specifier.type === 'ImportNamespaceSpecifier' ? '*' : 'default'), module };
        scope.bindings.set(specifier.local.name, binding);
        module.imports.set(specifier.local.name, binding);
      }
      for (const [key, child] of Object.entries(node)) {
        if (['comments', 'typeAnnotation', 'typeParameters', 'returnType'].includes(key)) continue;
        if (Array.isArray(child)) child.forEach((entry) => index(entry, scope));
        else index(child, scope);
      }
    }
    index(module.program, module.root);
    for (const statement of module.program.body) {
      if (statement.type === 'ExportNamedDeclaration' && statement.exportKind !== 'type') {
        const declaration = statement.declaration;
        if (declaration?.id) module.exports.set(declaration.id.name, { name: declaration.id.name, module });
        for (const entry of declaration?.declarations ?? []) if (entry.id.type === 'Identifier') {
          module.exports.set(entry.id.name, { name: entry.id.name, module });
        }
        for (const specifier of statement.specifiers) module.exports.set(propKey(specifier.exported), {
          name: propKey(specifier.local), source: statement.source?.value, module,
        });
      }
      if (statement.type === 'ExportDefaultDeclaration') module.exports.set('default', { node: statement.declaration, module });
      if (statement.type === 'ExportAllDeclaration' && statement.exportKind !== 'type') module.stars.push(statement.source.value);
    }
  }
  function lookup(node, module) {
    for (let scope = module.scopes.get(node) ?? module.root; scope; scope = scope.parent) {
      if (scope.bindings.has(node.name)) return scope.bindings.get(node.name);
    }
    return undefined;
  }
  function exported(module, name, seen = new Set()) {
    if (!module || seen.has(module)) return undefined;
    seen = new Set([...seen, module]);
    const entry = module.exports.get(name);
    if (entry?.source) return entry.source.startsWith('.')
      ? exported(dependency(module, entry.source), entry.name, seen) : entry;
    if (entry) {
      const binding = entry.node ? entry : module.root.bindings.get(entry.name);
      return binding?.source?.startsWith('.') ? exported(dependency(module, binding.source), binding.name, seen) : binding;
    }
    for (const source of module.stars) {
      const found = source.startsWith('.') ? exported(dependency(module, source), name, seen) : { source, name, module };
      if (found) return found;
    }
    return undefined;
  }
  const unresolved = [];
  function bindingFor(node, module, seen = new Set()) {
    if (!node || seen.has(node)) return undefined;
    seen = new Set([...seen, node]);
    if (wrappers.has(node.type)) return bindingFor(node.expression, module, seen);
    if (['MemberExpression', 'JSXMemberExpression'].includes(node.type)) {
      const object = bindingFor(node.object, module, seen);
      const name = (!node.computed || node.property.type === 'Literal') && propKey(node.property);
      if (object?.name === '*' && name) return object.source.startsWith('.')
        ? exported(dependency(object.module, object.source), name) : { ...object, name };
      return undefined;
    }
    if (!['Identifier', 'JSXIdentifier'].includes(node.type)) return { node, module };
    let binding = lookup(node, module);
    if (binding?.source?.startsWith('.') && binding.name !== '*') binding = exported(dependency(binding.module, binding.source), binding.name);
    if (binding?.node?.type === 'Identifier' && !binding.keys?.length && !binding.omit?.length) return bindingFor(binding.node, binding.module, seen);
    return binding;
  }
  function returns(node) {
    if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') return [node.body];
    const result = [];
    function visit(value) {
      if (!value || typeof value !== 'object' || functions.has(value.type)) return;
      if (value.type === 'ReturnStatement') result.push(value.argument);
      else for (const child of Object.values(value)) {
        if (Array.isArray(child)) child.forEach(visit);
        else visit(child);
      }
    }
    visit(node.body);
    return result;
  }
  function values(node, module, seen = new Set()) {
    if (!node || seen.has(node)) return [];
    seen = new Set([...seen, node]);
    if (wrappers.has(node.type)) return values(node.expression, module, seen);
    if (node.type === 'ObjectExpression') return [{ node, module }];
    if (node.type === 'Identifier') {
      const binding = bindingFor(node, module);
      if (!binding?.node) return [];
      let result = values(binding.node, binding.module, seen);
      for (const key of binding.keys ?? []) result = result.flatMap((value) => properties(value.node, value.module, seen)
        .filter((property) => property.name === key).flatMap((property) => values(property.node.value, property.module, seen)));
      return result.map((value) => ({ ...value, omit: binding.omit }));
    }
    if (['MemberExpression', 'OptionalMemberExpression'].includes(node.type)) {
      const key = (!node.computed || node.property.type === 'Literal') && propKey(node.property);
      return key ? properties(node.object, module, seen).filter((property) => property.name === key)
        .flatMap((property) => values(property.node.value, property.module, seen)) : [];
    }
    if (node.type === 'ConditionalExpression') return [node.consequent, node.alternate].flatMap((value) => values(value, module, seen));
    if (node.type === 'LogicalExpression') return [node.left, node.right].flatMap((value) => values(value, module, seen));
    if (node.type === 'CallExpression') {
      const target = bindingFor(node.callee, module);
      const factory = target?.source === 'react' && target.name === 'useMemo';
      const callback = factory ? node.arguments[0] : target?.node;
      if (callback && functions.has(callback.type)) return returns(callback)
        .flatMap((value) => values(value, factory ? module : target.module, seen));
    }
    return [];
  }
  function properties(node, module, seen = new Set()) {
    const resolved = values(node, module, seen);
    if (!resolved.length && node) unresolved.push({ node, module });
    return resolved.flatMap((value) => {
      if (seen.has(value.node)) return [];
      const next = new Set([...seen, value.node]);
      return value.node.properties.flatMap((property) => {
        if (property.type === 'SpreadElement') return properties(property.argument, value.module, next);
        const name = (!property.computed || property.key.type === 'Literal') && propKey(property.key);
        return name && !value.omit?.includes(name) ? [{ name, node: property, module: value.module }] : [];
      });
    });
  }
  return { modules, bindingFor, properties, exported, unresolved };
}
