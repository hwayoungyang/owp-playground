import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseSync } from 'vite';

const digest = (content) => createHash('sha256').update(content).digest('hex');
const nameOf = (node) => node?.name ?? node?.value;

/** 공개 declaration의 export/import 관계를 따라 실제 선언과 JSDoc을 읽습니다. */
export async function readDeclarations(directory, { externalPackages = [], externalReexportPackages = [], additionalEntries = {} } = {}) {
  const allowedExternals = new Set(externalPackages);
  const allowedReexports = new Set(externalReexportPackages);
  const packageOf = (specifier) => specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/');
  const modules = new Map();
  async function load(file) {
    if (modules.has(file)) return modules.get(file);
    const content = await readFile(file, 'utf8');
    const parsed = parseSync(file, content);
    if (parsed.errors.length) throw new SyntaxError(`API declaration: ${file}`);
    const module = { file, content, program: parsed.program, comments: parsed.comments, declarations: new Map(), statements: new Map(), imports: new Map(), externals: new Map(), externalBindings: new Map(), exports: new Map(), stars: [] };
    modules.set(file, module);
    const target = (specifier) => path.resolve(path.dirname(file), /\.d\.ts$/.test(specifier) ? specifier : /\.js$/.test(specifier) ? specifier.replace(/\.js$/, '.d.ts') : `${specifier}.d.ts`);
    for (const statement of parsed.program.body) {
      const node = statement.declaration ?? statement;
      if (node.id?.name) { module.declarations.set(node.id.name, node); module.statements.set(node.start, statement); }
      for (const declaration of node.declarations ?? []) { module.declarations.set(declaration.id.name, declaration); module.statements.set(declaration.start, statement); }
      if (statement.type === 'ImportDeclaration' && statement.source.value.startsWith('.')) {
        const dependency = target(statement.source.value);
        await load(dependency);
        for (const specifier of statement.specifiers) module.imports.set(nameOf(specifier.local), { file: dependency, name: nameOf(specifier.imported), typeOnly: statement.importKind === 'type' || specifier.importKind === 'type' });
      }
      if (statement.type === 'ImportDeclaration' && !statement.source.value.startsWith('.')) {
        const packageName = packageOf(statement.source.value);
        for (const specifier of statement.specifiers) {
          const importedName = specifier.type === 'ImportDefaultSpecifier' ? 'default' : nameOf(specifier.imported);
          if (!importedName) continue;
          module.externals.set(nameOf(specifier.local), `${packageName}:${importedName}`);
          module.externalBindings.set(nameOf(specifier.local), { module: statement.source.value, package: packageName, importedName, typeOnly: statement.importKind === 'type' || specifier.importKind === 'type', sourceModule: module, node: statement });
        }
      }
      if (statement.type === 'ExportAllDeclaration' && statement.source.value.startsWith('.')) {
        const dependency = target(statement.source.value);
        await load(dependency);
        module.stars.push(dependency);
      }
      if (statement.type === 'ExportNamedDeclaration') {
        const dependency = statement.source?.value.startsWith('.') ? target(statement.source.value) : file;
        if (dependency !== file) await load(dependency);
        for (const specifier of statement.specifiers) module.exports.set(nameOf(specifier.exported), { file: dependency, name: nameOf(specifier.local), typeOnly: statement.exportKind === 'type' || specifier.exportKind === 'type', external: statement.source && !statement.source.value.startsWith('.') ? statement.source.value : undefined, node: statement });
        if (node.id?.name) module.exports.set(node.id.name, { file, name: node.id.name });
        for (const declaration of node.declarations ?? []) module.exports.set(declaration.id.name, { file, name: declaration.id.name });
      }
    }
    return module;
  }
  function resolve(file, name, visited = new Set()) {
    const key = `${file}:${name}`;
    if (visited.has(key)) return undefined;
    visited.add(key);
    const module = modules.get(file);
    const node = module.declarations.get(name);
    if (node) return { module, node };
    const reference = module.imports.get(name) ?? module.exports.get(name);
    if (reference && (reference.file !== file || reference.name !== name)) {
      const resolved = resolve(reference.file, reference.name, visited);
      if (resolved) return resolved;
    }
    for (const star of module.stars) {
      const resolved = resolve(star, name, visited);
      if (resolved) return resolved;
    }
    return undefined;
  }
  function exportsOf(file, visited = new Set()) {
    if (visited.has(file)) return [];
    visited.add(file);
    const module = modules.get(file);
    return [...module.exports.keys(), ...module.stars.flatMap((star) => exportsOf(star, visited))];
  }
  function resolveExternal(file, name, visited = new Set()) {
    const key = `${file}:${name}`;
    if (visited.has(key)) return undefined;
    visited.add(key);
    const module = modules.get(file);
    const exported = module.exports.get(name);
    if (exported?.external) return { module: exported.external, package: packageOf(exported.external), importedName: exported.name, typeOnly: exported.typeOnly, sourceModule: module, node: exported.node };
    if (module.declarations.has(name)) return undefined;
    const reference = module.imports.get(name) ?? exported;
    if (reference && (reference.file !== file || reference.name !== name)) {
      const resolved = resolveExternal(reference.file, reference.name, visited);
      if (resolved) return { ...resolved, typeOnly: exported?.typeOnly || reference.typeOnly || resolved.typeOnly };
    }
    const external = module.externalBindings.get(name);
    if (external) return { ...external, typeOnly: exported?.typeOnly || external.typeOnly };
    for (const star of module.stars) {
      const resolved = resolveExternal(star, name, visited);
      if (resolved) return resolved;
    }
    return undefined;
  }
  const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
  const publicSymbols = new Map();
  const externalSymbols = new Map();
  function exportedTypes(definition) {
    if (!definition || typeof definition !== 'object') return undefined;
    if (typeof definition.types === 'string') return definition.types;
    for (const value of Object.values(definition)) {
      const result = exportedTypes(value);
      if (result) return result;
    }
    return undefined;
  }
  const exportedEntries = { ...(manifest.exports ? Object.keys(manifest.exports).some((key) => key.startsWith('.')) ? manifest.exports : { '.': manifest.exports } : { '.': { types: manifest.types ?? manifest.typings } }), ...additionalEntries };
  for (const [entry, definition] of Object.entries(exportedEntries)) {
    const types = exportedTypes(definition);
    if (!types || entry === './package.json') continue;
    const file = path.resolve(directory, types);
    await load(file);
    for (const name of exportsOf(file)) {
      const resolved = resolve(file, name);
      if (!resolved) {
        const external = resolveExternal(file, name);
        if (!external || !allowedReexports.has(external.package)) continue;
        const key = JSON.stringify([name, external.module, external.importedName]);
        const previous = externalSymbols.get(key);
        const publicImport = entry === '.' ? manifest.name : `${manifest.name}/${entry.slice(2)}`;
        if (previous) { previous.imports.push(publicImport); previous.typeOnly &&= external.typeOnly; }
        else externalSymbols.set(key, { ...external, name, imports: [publicImport] });
        continue;
      }
      const key = `${resolved.module.file}:${resolved.node.start}`;
      const previous = publicSymbols.get(key);
      if (previous) previous.imports.push(entry === '.' ? manifest.name : `${manifest.name}/${entry.slice(2)}`);
      else publicSymbols.set(key, { ...resolved, name, imports: [entry === '.' ? manifest.name : `${manifest.name}/${entry.slice(2)}`] });
    }
  }
  for (const symbol of publicSymbols.values()) {
    function include(node, inheritedScope = new Set()) {
      if (!node || typeof node !== 'object') return;
      const scope = new Set([...inheritedScope, ...(node.typeParameters?.params ?? []).map((parameter) => nameOf(parameter.name))]);
      const name = node.type === 'TSTypeReference' ? node.typeName?.name : node.type === 'TSInterfaceHeritage' ? node.expression?.name : node.type === 'TSTypeQuery' ? node.exprName?.name : undefined;
      if (name && !scope.has(name)) {
        const resolved = resolve(symbol.module.file, name);
        if (resolved) {
          const key = `${resolved.module.file}:${resolved.node.start}`;
          if (!publicSymbols.has(key)) publicSymbols.set(key, { ...resolved, name: resolved.node.id?.name ?? name, imports: [] });
        }
      }
      for (const child of Object.values(node)) {
        if (Array.isArray(child)) child.forEach((value) => include(value, scope));
        else if (child && typeof child === 'object') include(child, scope);
      }
    }
    include(symbol.node);
  }
  const documentation = (module, node) => {
    node = module.statements.get(node.start) ?? node;
    const comment = module.comments.findLast((item) => item.end <= node.start && module.content.slice(item.start, item.end).startsWith('/**'));
    if (!comment || module.content.slice(comment.end, node.start).replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, '').trim()) return '';
    return comment.value.replace(/^\*/, '').split('\n').map((line) => line.replace(/^\s*\* ?/, '')).join('\n').trim();
  };
  function referenceNames(module, node, outerScope = new Set()) {
    const found = new Map();
    function visit(value, scope) {
      if (!value || typeof value !== 'object') return;
      const localScope = new Set([...scope, ...(value.typeParameters?.params ?? []).map((parameter) => nameOf(parameter.name))]);
      const referenceName = value.type === 'TSTypeReference' ? value.typeName?.name : value.type === 'TSInterfaceHeritage' ? value.expression?.name : value.type === 'TSTypeQuery' ? value.exprName?.name : undefined;
      if (referenceName && !localScope.has(referenceName)) {
        const ref = resolve(module.file, referenceName);
        if (ref) {
          const symbol = publicSymbols.get(`${ref.module.file}:${ref.node.start}`);
          if (symbol) found.set(referenceName, `${manifest.name}:${symbol.name}`);
        } else {
          const external = module.externals.get(referenceName);
          if (external && allowedExternals.has(external.split(':')[0])) found.set(referenceName, external);
        }
      }
      for (const child of Object.values(value)) {
        if (Array.isArray(child)) child.forEach((item) => visit(item, localScope));
        else if (child && typeof child === 'object') visit(child, localScope);
      }
    }
    visit(node, outerScope);
    return Object.fromEntries([...found].sort(([a], [b]) => a.localeCompare(b)));
  }
  const references = (module, node, scope) => [...new Set(Object.values(referenceNames(module, node, scope)))].sort();
  const records = [];
  const reexports = [];
  for (const external of externalSymbols.values()) {
    const { name, importedName, typeOnly, sourceModule, node } = external;
    const imports = [...new Set(external.imports)].sort();
    const localNamesake = [...publicSymbols.values()].find((symbol) => symbol.name === name);
    const otherTargets = [...externalSymbols.values()].filter((symbol) => symbol !== external && symbol.name === name);
    if (otherTargets.some((symbol) => symbol.imports.some((entry) => imports.includes(entry))) || localNamesake?.imports.some((entry) => imports.includes(entry))) throw new TypeError(`같은 import 경로에서 export 이름이 중복됩니다: ${manifest.name}:${name}`);
    const qualified = localNamesake || otherTargets.length > 0;
    const owner = qualified ? `${imports[0] === manifest.name ? 'index' : imports[0].slice(manifest.name.length + 1)}/${name}` : name;
    const id = `${manifest.name}:${owner}`;
    const binding = `${typeOnly ? 'type ' : ''}${importedName}${importedName === name ? '' : ` as ${name}`}`;
    records.push({ id, package: manifest.name, packageVersion: manifest.version, owner, name, path: '', kind: typeOnly ? 'type' : 'constant', imports, description: `외부 API re-export: ${external.module}의 ${importedName}.`, signature: `export { ${binding} } from ${JSON.stringify(external.module)};`, typeParameters: [], typeReferences: {}, optional: false, bases: [], related: [], source: { path: `${manifest.name}/${path.relative(directory, sourceModule.file).split(path.sep).join('/')}`, line: sourceModule.content.slice(0, node.start).split('\n').length, sha256: digest(sourceModule.content) } });
    reexports.push({ id, package: external.package, module: external.module, importedName, typeOnly });
  }
  function bases(module, node, scope = new Set()) {
    if (!node) return [];
    if (node.type === 'TSParenthesizedType') return bases(module, node.typeAnnotation, scope);
    if (node.type === 'TSIntersectionType') return node.types.flatMap((part) => bases(module, part, scope));
    if (node.type === 'TSUnionType') return node.types.flatMap((part) => bases(module, part, scope)).map((base) => ({ ...base, conditional: true }));
    if (node.type !== 'TSTypeReference' && node.type !== 'TSInterfaceHeritage') return [];
    const name = node.typeName?.name ?? node.expression?.name;
    if (scope.has(name)) return [];
    const args = node.typeArguments?.params ?? [];
    if (['Omit', 'Pick', 'Partial', 'Required', 'Readonly'].includes(name)) {
      const keys = (value) => value?.type === 'TSUnionType' ? value.types.flatMap(keys) : value?.type === 'TSLiteralType' ? [value.literal.value] : [];
      return bases(module, args[0], scope).map((base) => ({ ...base, omit: name === 'Omit' ? [...base.omit, ...keys(args[1])] : base.omit, pick: name === 'Pick' ? keys(args[1]) : base.pick, partial: name === 'Required' ? false : name === 'Partial' || base.partial, required: name === 'Partial' ? false : name === 'Required' || base.required }));
    }
    const resolved = resolve(module.file, name);
    const symbol = resolved && publicSymbols.get(`${resolved.module.file}:${resolved.node.start}`);
    const id = symbol ? `${manifest.name}:${symbol.name}` : module.externals.get(name);
    return id ? [{ id, omit: [], pick: [], partial: false, required: false, conditional: false, arguments: args.map((argument) => module.content.slice(argument.start, argument.end)) }] : [];
  }
  function callableTarget(module, node, seen = new Set()) {
    if (seen.has(node)) return undefined;
    seen.add(node);
    const annotation = node.type === 'VariableDeclarator' ? node.id.typeAnnotation?.typeAnnotation : node.typeAnnotation;
    if (node.type === 'TSDeclareFunction' || annotation?.type === 'TSFunctionType') return { module, node };
    if (annotation?.type === 'TSTypeQuery' && annotation.exprName?.type === 'Identifier') {
      const target = resolve(module.file, annotation.exprName.name);
      if (target) return callableTarget(target.module, target.node, seen);
    }
    return undefined;
  }
  function isReactExoticComponent(annotation) {
    if (!annotation) return false;
    if (annotation.type === 'TSIntersectionType') return annotation.types.some(isReactExoticComponent);
    if (annotation.type === 'TSParenthesizedType') return isReactExoticComponent(annotation.typeAnnotation);
    return annotation.type === 'TSImportType' && annotation.source?.value === 'react'
      && ['ForwardRefExoticComponent', 'NamedExoticComponent', 'MemoExoticComponent'].includes(annotation.qualifier?.name);
  }
  for (const symbol of publicSymbols.values()) {
    const { module, node, name, imports } = symbol;
    const source = { path: `${manifest.name}/${path.relative(directory, module.file).split(path.sep).join('/')}`, line: module.content.slice(0, node.start).split('\n').length, sha256: digest(module.content) };
    const id = `${manifest.name}:${name}`;
    const scope = new Set((node.typeParameters?.params ?? []).map((parameter) => nameOf(parameter.name)));
    const callable = node.type === 'VariableDeclarator' || node.type === 'TSDeclareFunction' ? callableTarget(module, node) : undefined;
    const exoticComponent = node.type === 'VariableDeclarator' && isReactExoticComponent(node.id.typeAnnotation?.typeAnnotation);
    const kind = exoticComponent ? 'component' : callable ? (/^[A-Z][a-z]/.test(name) ? 'component' : 'function') : node.type === 'VariableDeclarator' ? 'constant' : 'type';
    const parameters = node.typeParameters?.params ?? callable?.node.id?.typeAnnotation?.typeAnnotation?.typeParameters?.params ?? [];
    const typeParameters = parameters.map((parameter) => ({ name: nameOf(parameter.name), constraint: parameter.constraint ? module.content.slice(parameter.constraint.start, parameter.constraint.end) : null, default: parameter.default ? module.content.slice(parameter.default.start, parameter.default.end) : null }));
    const related = [...new Set([...references(module, node), ...(callable ? references(callable.module, callable.node) : [])])].filter((ref) => ref !== id);
    const base = { id, package: manifest.name, packageVersion: manifest.version, owner: name, name, path: '', kind, imports: [...new Set(imports)].sort(), description: documentation(module, node), signature: module.content.slice(node.start, node.end), typeParameters, typeReferences: { ...referenceNames(module, node), ...(callable ? referenceNames(callable.module, callable.node) : {}) }, optional: false, bases: node.type === 'TSInterfaceDeclaration' ? (node.extends ?? []).flatMap((value) => bases(module, value, scope)) : bases(module, node.typeAnnotation, scope), related, source };
    records.push(base);
    function members(value, prefix = '', conditional = false) {
      if (!value) return;
      if (value.type === 'TSParenthesizedType') members(value.typeAnnotation, prefix, conditional);
      if (value.type === 'TSConditionalType') {
        members(value.trueType, prefix, true);
        members(value.falseType, prefix, true);
      }
      if (value.type === 'TSIntersectionType' || value.type === 'TSUnionType') value.types.forEach((part) => members(part, prefix, conditional || value.type === 'TSUnionType'));
      const properties = value.type === 'TSInterfaceBody' || value.type === 'ClassBody' ? value.body : value.type === 'TSTypeLiteral' ? value.members : [];
      for (const member of properties) {
        const key = nameOf(member.key);
        if (key === undefined) continue;
        const memberPath = prefix ? `${prefix}.${key}` : String(key);
        const annotation = member.typeAnnotation?.typeAnnotation;
        records.push({ ...base, id: `${id}.${memberPath}`, name: String(key), path: memberPath, bases: [], kind: name === 'OwpDataGridApi' || /Handle$/.test(name) || member.type === 'TSMethodSignature' || member.type === 'MethodDefinition' ? 'method' : /^on[A-Z]/.test(String(key)) ? 'event' : 'property', description: documentation(module, member), signature: annotation ? module.content.slice(annotation.start, annotation.end) : module.content.slice(member.start, member.end), optional: Boolean(member.optional), requirement: conditional ? 'conditional' : member.optional ? 'optional' : 'required', related: references(module, member, scope).filter((ref) => ref !== id), source: { ...source, line: module.content.slice(0, member.start).split('\n').length } });
        if (annotation?.type === 'TSTypeLiteral') members(annotation, memberPath);
      }
    }
    members(node.type === 'TSInterfaceDeclaration' || node.type === 'ClassDeclaration' ? node.body : node.typeAnnotation);
  }
  const unique = new Map();
  for (const record of records) {
    const previous = unique.get(record.id);
    const signatures = previous ? [...new Set([previous.signature, record.signature])] : [record.signature];
    const signature = signatures.length > 1 ? signatures.map((value) => value.includes('=>') ? `(${value})` : value).join(' | ') : record.signature;
    unique.set(record.id, previous ? { ...previous, signature, optional: previous.optional || record.optional, related: [...new Set([...previous.related, ...record.related])].sort() } : record);
  }
  const runtimeFiles = (await readdir(path.join(directory, 'dist'), { recursive: true })).filter((file) => file.endsWith('.js') || file.endsWith('.cjs')).sort();
  const runtimeHash = digest((await Promise.all(runtimeFiles.map(async (file) => `${file}\n${await readFile(path.join(directory, 'dist', file), 'utf8')}`))).join('\n'));
  const augmentations = [...modules.values()].flatMap((module) => module.program.body.flatMap((statement) => {
    if (statement.type !== 'TSModuleDeclaration' || typeof statement.id.value !== 'string' || statement.body?.type !== 'TSModuleBlock') return [];
    return statement.body.body.flatMap((entry) => {
      const node = entry.declaration ?? entry;
      if (node.type !== 'TSInterfaceDeclaration') return [];
      return [{ id: `${statement.id.value}:${node.id.name}`, open: node.body.body.some((member) => member.type !== 'TSPropertySignature' || member.computed), keys: node.body.body.filter((member) => member.type === 'TSPropertySignature' && !member.computed).map((member) => String(nameOf(member.key))), source: { path: `${manifest.name}/${path.relative(directory, module.file).split(path.sep).join('/')}`, line: module.content.slice(0, node.start).split('\n').length, sha256: digest(module.content) } }];
    });
  }));
  return { version: manifest.version, records: [...unique.values()].sort((a, b) => a.id.localeCompare(b.id)), reexports, augmentations, declarationHash: digest([...modules.values()].map((module) => module.content).sort().join('\n')), runtimeHash };
}
