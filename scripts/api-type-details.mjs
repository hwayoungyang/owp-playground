import { parseSync } from 'vite';
import { bindTypeArguments, substituteType } from './api-type-substitution.mjs';

const parseType = (text) => {
  const parsed = parseSync('api-type.ts', `type __Type = ${text};`);
  return parsed.errors.length ? null : parsed.program.body[0]?.typeAnnotation;
};
const union = (parts) => [...new Set(parts.flat())];

/** 닫힌 literal union의 허용 값을 추출하고 generic의 상위 제약과 구분합니다. */
export function describeApiTypes(records, augmentations = []) {
  const byId = new Map(records.map((record) => [record.id, record]));
  const parsed = new Map();
  function definition(record) {
    if (parsed.has(record.id)) return parsed.get(record.id);
    const result = parseSync('api-declaration.ts', record.signature);
    const declaration = result.errors.length ? null : result.program.body[0]?.declaration ?? result.program.body[0];
    const type = declaration?.type === 'TSTypeAliasDeclaration' ? declaration.typeAnnotation : null;
    parsed.set(record.id, type);
    return type;
  }
  function reference(context, name) {
    const id = context.typeReferences?.[name];
    return byId.get(id ?? `${context.package}:${name}`);
  }
  function finite(node, context, parameters, seen = new Set()) {
    if (!node) return null;
    if (node.type === 'TSParenthesizedType') return finite(node.typeAnnotation, context, parameters, seen);
    if (node.type === 'TSLiteralType') {
      const literal = node.literal;
      if (literal.type === 'UnaryExpression' && literal.operator === '-' && typeof literal.argument.value === 'number') return { values: [String(-literal.argument.value)], sources: [], augmentationSources: [] };
      if (!['string', 'number', 'boolean'].includes(typeof literal.value)) return null;
      return { values: [JSON.stringify(literal.value)], sources: [], augmentationSources: [] };
    }
    if (node.type === 'TSNullKeyword') return { values: ['null'], sources: [], augmentationSources: [] };
    if (node.type === 'TSUndefinedKeyword') return { values: ['undefined'], sources: [], augmentationSources: [] };
    if (node.type === 'TSUnionType') {
      const parts = node.types.map((part) => finite(part, context, parameters, new Set(seen)));
      if (parts.some((part) => !part)) return null;
      return { values: union(parts.map((part) => part.values)), sources: union(parts.map((part) => part.sources)), augmentationSources: parts.flatMap((part) => part.augmentationSources), constrained: parts.some((part) => part.constrained), extensible: parts.some((part) => part.extensible) };
    }
    if (node.type === 'TSTypeOperator' && node.operator === 'keyof' && node.typeAnnotation.type === 'TSTypeReference') {
      const target = reference(context, node.typeAnnotation.typeName.name);
      if (!target || seen.has(target.id)) return null;
      const result = parseSync('api-keys.ts', target.signature);
      const declaration = result.program.body[0]?.declaration ?? result.program.body[0];
      if (declaration?.type !== 'TSInterfaceDeclaration' || declaration.extends.length) return null;
      if (declaration.body.body.some((member) => member.type !== 'TSPropertySignature' || member.computed)) return null;
      const additions = augmentations.filter((entry) => entry.id === target.id);
      if (additions.some((entry) => entry.open)) return null;
      const keys = [...declaration.body.body.map((member) => member.key.name ?? member.key.value), ...additions.flatMap((entry) => entry.keys)];
      return { values: [...new Set(keys)].map((key) => JSON.stringify(key)), sources: [target.id], augmentationSources: additions.map((entry) => entry.source), extensible: true };
    }
    if (node.type !== 'TSTypeReference' || node.typeName.type !== 'Identifier') return null;
    const name = node.typeName.name;
    const parameter = parameters.find((entry) => entry.name === name);
    if (parameter) {
      if (!parameter.constraint || seen.has(`parameter:${name}`)) return null;
      const next = new Set(seen).add(`parameter:${name}`);
      const result = finite(parseType(parameter.constraint), context, parameters, next);
      return result ? { ...result, constrained: true } : null;
    }
    const target = reference(context, name);
    if (!target || seen.has(target.id)) return null;
    const next = new Set(seen).add(target.id);
    let type = definition(target);
    if (!type) return null;
    const arguments_ = node.typeArguments?.params ?? [];
    // Use the original text offsets only when arguments are present; literals/defaults remain exact.
    if (arguments_.length || target.typeParameters?.some((parameter) => parameter.default)) {
      const argumentText = arguments_.map((argument) => printArgument(argument));
      if (argumentText.some((argument) => argument === null)) return null;
      const bindings = bindTypeArguments(target.typeParameters ?? [], argumentText);
      const declaration = target.signature;
      const text = declaration.slice(type.start, type.end);
      type = parseType(substituteType(text, bindings));
    }
    const result = finite(type, target, target.typeParameters ?? [], next);
    return result ? { ...result, sources: union([[target.id], result.sources]) } : null;
  }
  function printArgument(node) {
    if (node.type === 'TSLiteralType') return JSON.stringify(node.literal.value);
    if (node.type === 'TSTypeReference' && node.typeName.type === 'Identifier' && !node.typeArguments) return node.typeName.name;
    return null;
  }
  return records.map((record) => {
    const parameters = record.typeParameters ?? [];
    const node = record.path ? parseType(record.signature) : definition(record);
    const result = record.typeReferenceConflicts?.length ? null : finite(node, record, parameters);
    const names = new Set([record.signature, ...parameters.flatMap((parameter) => [parameter.constraint ?? '', parameter.default ?? ''])].join(' ').match(/[A-Za-z_$][\w$]*/g) ?? []);
    const typeReferences = Object.fromEntries(Object.entries(record.typeReferences ?? {}).filter(([name]) => names.has(name) && !record.typeReferenceConflicts?.includes(name)));
    return { ...record, typeReferences, related: union([record.related, result?.sources ?? []]), typeDetails: {
      values: result?.values ?? [],
      valueKind: result ? result.constrained ? 'constraint' : 'exact' : null,
      extensible: Boolean(result?.extensible),
      sources: result?.sources ?? [],
      augmentationSources: result?.augmentationSources ?? [],
    } };
  });
}
