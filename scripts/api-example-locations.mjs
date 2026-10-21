import { parseSync } from 'vite';

const keyName = (node) => node?.name ?? (typeof node?.value === 'string' ? node.value : undefined);
const parsedFiles = new Map();

function memberPath(node) {
  if (node?.type === 'ChainExpression') return memberPath(node.expression);
  if (node?.type === 'Identifier') return [node.name];
  if (!['MemberExpression', 'OptionalMemberExpression'].includes(node?.type)) return [];
  const key = (!node.computed || node.property.type === 'Literal') && keyName(node.property);
  return key ? [...memberPath(node.object), key] : [];
}

function containsPath(context, path) {
  let index = 0;
  for (const key of context) if (key === path[index]) index += 1;
  return index === path.length;
}

function refersToOwner(node, owners) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'TSTypeAnnotation') return refersToOwner(node.typeAnnotation, owners);
  if (node.type === 'TSArrayType') return refersToOwner(node.elementType, owners);
  if (node.type === 'TSIntersectionType') return node.types.some((type) => refersToOwner(type, owners));
  if (node.type !== 'TSTypeReference') return false;
  const name = keyName(node.typeName);
  if (owners.has(name)) return true;
  return ['Array', 'ReadonlyArray', 'Readonly', 'Partial', 'Required'].includes(name)
    && refersToOwner(node.typeArguments?.params[0], owners);
}

function hasOwnerContext(ancestors, owners, components, factories) {
  let value = ancestors.at(-1);
  let returned = false;
  for (const node of ancestors.slice(0, -1).toReversed()) {
    if (node.type === 'ParenthesizedExpression' || node.type === 'ArrayExpression') {
      value = node;
      continue;
    }
    if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression') return node.expression === value && refersToOwner(node.typeAnnotation, owners);
    if (node.type === 'VariableDeclarator') return node.init === value && refersToOwner(node.id.typeAnnotation, owners);
    if (node.type === 'ReturnStatement' && node.argument === value) {
      returned = true;
      value = node;
      continue;
    }
    if (node.type === 'BlockStatement' && returned && node.body.includes(value)) {
      value = node;
      continue;
    }
    if (['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration'].includes(node.type)) {
      if (node.body !== value || (node.type !== 'ArrowFunctionExpression' && !returned)) return false;
      if (refersToOwner(node.returnType, owners)) return true;
      value = node;
      continue;
    }
    if (node.type === 'CallExpression') return node.arguments[0] === value
      && factories.has(memberPath(node.callee).join('.'))
      && refersToOwner(node.typeArguments?.params[0], owners);
    if (node.type === 'JSXSpreadAttribute') {
      const opening = ancestors.findLast((entry) => entry.type === 'JSXOpeningElement');
      return node.argument === value && components.has(keyName(opening?.name));
    }
    return false;
  }
  return false;
}

function permitsLiteral(record, node) {
  if (record.typeDetails?.valueKind !== 'exact' || !record.typeDetails.values.length) return true;
  const value = node?.type === 'JSXExpressionContainer' ? node.expression : node;
  return value?.type !== 'Literal' || record.typeDetails.values.includes(JSON.stringify(value.value));
}

/** 실제 AST의 속성·호출·타입 사용 위치만 연결하며 문자열·주석의 우연한 일치는 제외함. */
export function locateExampleCode(record, label, files) {
  const candidates = [];
  const key = record.path ? record.path.split('.').at(-1) : record.name;
  const labelKey = label.split('.').at(-1);
  const qualifier = label.split('.').slice(0, -1);
  const component = record.owner.replace(/(?:Base)?Props$/, '');
  for (const file of files) {
    if (!/\.tsx?$/.test(file.file)) continue;
    let parsed = parsedFiles.get(file.content);
    if (!parsed) {
      parsed = parseSync(file.file, file.content);
      if (parsed.errors.length) throw new SyntaxError(`예제 코드 위치 분석 실패: ${file.file}`);
      parsedFiles.set(file.content, parsed);
    }
    const aliases = new Set();
    const owners = new Set([record.owner]);
    const factories = new Set();
    const components = new Set([component]);
    const jsxBindings = new Map();
    function collectBindings(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'JSXAttribute' && node.value?.expression?.type === 'Identifier') {
        const name = node.value.expression.name;
        const bindings = jsxBindings.get(name) ?? new Set();
        bindings.add(keyName(node.name));
        jsxBindings.set(name, bindings);
      }
      for (const [name, child] of Object.entries(node)) {
        if (name === 'comments') continue;
        if (Array.isArray(child)) child.forEach(collectBindings);
        else if (child && typeof child === 'object') collectBindings(child);
      }
    }
    collectBindings(parsed.program);
    for (const statement of parsed.program.body) {
      if (statement.type !== 'ImportDeclaration') continue;
      if (statement.source.value === 'react') for (const specifier of statement.specifiers) {
        if (['useMemo', 'useState'].includes(keyName(specifier.imported))) factories.add(specifier.local.name);
        if (specifier.type === 'ImportNamespaceSpecifier' || specifier.type === 'ImportDefaultSpecifier') for (const name of ['useMemo', 'useState']) factories.add(`${specifier.local.name}.${name}`);
      }
      if (statement.source.value !== record.package && !statement.source.value.startsWith(`${record.package}/`)) continue;
      for (const specifier of statement.specifiers) {
        if (keyName(specifier.imported) === record.name) aliases.add(specifier.local.name);
        if (keyName(specifier.imported) === component) components.add(specifier.local.name);
        if (keyName(specifier.imported) === record.owner) owners.add(specifier.local.name);
      }
    }
    function visit(node, ancestors = []) {
      if (!node || typeof node !== 'object') return;
      const parent = ancestors.at(-1);
      let score = 0;
      let start = node.start;
      let end = node.end;
      if (record.path || labelKey !== record.name) {
        const matches = (name) => name === key || name === labelKey;
        if (['MemberExpression', 'OptionalMemberExpression'].includes(node.type) && matches(keyName(node.property)) && (!node.computed || node.property.type === 'Literal')) {
          const receiver = memberPath(node.object);
          if ((!qualifier.length && record.kind === 'method') || (qualifier.length && qualifier.every((part, index) => receiver[receiver.length - qualifier.length + index] === part))) {
            score = record.kind === 'method' ? 650 : 180;
            if (parent?.type === 'CallExpression' || parent?.type === 'ChainExpression') end = parent.end;
          }
        }
        if (node.type === 'JSXAttribute' && matches(keyName(node.name))) {
          const opening = ancestors.findLast((entry) => entry.type === 'JSXOpeningElement');
          if (/Props$/.test(record.owner) && components.has(keyName(opening?.name))) score = 850;
        }
        if (node.type === 'Property' && parent?.type !== 'ObjectPattern' && !node.computed && matches(keyName(node.key))) {
          if (qualifier.length || hasOwnerContext(ancestors, owners, components, factories)) score = 260;
          end = node.key.end;
        }
        if (score && qualifier.length && !['MemberExpression', 'OptionalMemberExpression'].includes(node.type)) {
          const contexts = [[]];
          for (const entry of ancestors) {
            let names = [];
            if (entry.type === 'Property' || entry.type === 'TSPropertySignature') names = [keyName(entry.key)];
            if (entry.type === 'JSXAttribute') names = [keyName(entry.name)];
            if (entry.type === 'VariableDeclarator' && entry.id.type === 'Identifier') names = [entry.id.name, ...(jsxBindings.get(entry.id.name) ?? [])];
            if (names.length) {
              const paths = contexts.splice(0);
              for (const path of paths) for (const name of names) contexts.push([...path, name]);
            }
          }
          if (contexts.some((context) => containsPath(context, qualifier))) score += 450;
          else score = 0;
        }
        if (score && !permitsLiteral(record, node.value)) score = 0;
      } else if (node.type === 'Identifier' && aliases.has(node.name)) {
        if (parent?.type === 'ImportSpecifier' || parent?.type === 'ExportSpecifier') score = 20;
        else if (parent?.type === 'JSXOpeningElement' || parent?.type === 'TSTypeReference' || parent?.type === 'CallExpression') score = 500;
      }
      if (score > 0) {
        const line = file.content.slice(0, start).split('\n').length;
        const endLine = Math.min(line + 15, file.content.slice(0, end).split('\n').length);
        candidates.push({ file: file.file.replace(/^\/src\//, ''), line, endLine, sha256: file.sha256, score: score + file.priority });
      }
      for (const [name, child] of Object.entries(node)) {
        if (name === 'comments') continue;
        if (Array.isArray(child)) child.forEach((value) => visit(value, [...ancestors, node]));
        else if (child && typeof child === 'object') visit(child, [...ancestors, node]);
      }
    }
    visit(parsed.program);
  }
  const best = candidates.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file) || a.line - b.line)[0];
  if (!best) return null;
  const { score: _score, ...location } = best;
  return location;
}
