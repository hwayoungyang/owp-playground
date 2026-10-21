import { parseSync } from 'vite';

/** 타입 참조만 치환하고 문자열 literal, 속성 이름과 지역 generic은 보존합니다. */
export function substituteType(signature, bindings) {
  if (!bindings.size) return signature;
  const wrappers = [
    ['type __Knowledge = ', ';'],
    ['interface __Knowledge { ', ' }'],
    ['declare class __Knowledge { ', ' }'],
  ];
  let parsed;
  let offset;
  for (const [prefix, suffix] of wrappers) {
    const candidate = parseSync('knowledge-type.ts', `${prefix}${signature}${suffix}`);
    if (candidate.errors.length) continue;
    parsed = candidate.program;
    offset = prefix.length;
    break;
  }
  if (!parsed) throw new SyntaxError(`상속 타입을 해석할 수 없습니다: ${signature}`);
  const edits = [];
  function visit(node, scope = new Set()) {
    if (!node || typeof node !== 'object') return;
    const local = new Set([...scope, ...(node.typeParameters?.params ?? []).map((parameter) => parameter.name?.name ?? parameter.name)]);
    if (node.type === 'TSTypeReference' && node.typeName?.type === 'Identifier') {
      const name = node.typeName.name;
      const argument = bindings.get(name);
      if (argument && argument !== name && !local.has(name)) {
        const type = parseSync('knowledge-argument.ts', `type Argument = ${argument};`).program.body[0]?.typeAnnotation;
        const replacement = ['TSUnionType', 'TSIntersectionType', 'TSConditionalType', 'TSFunctionType', 'TSConstructorType'].includes(type?.type) ? `(${argument})` : argument;
        edits.push({ start: node.typeName.start - offset, end: node.typeName.end - offset, replacement });
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach((child) => visit(child, local));
      else if (value && typeof value === 'object') visit(value, local);
    }
  }
  visit(parsed);
  let result = signature;
  for (const edit of edits.sort((left, right) => right.start - left.start)) result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
  return result;
}

export function bindTypeArguments(parameters, arguments_) {
  const bindings = new Map();
  for (const [index, parameter] of parameters.entries()) {
    const argument = arguments_[index] ?? parameter.default ?? parameter.name;
    bindings.set(parameter.name, substituteType(argument, bindings));
  }
  return bindings;
}
