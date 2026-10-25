import { readFile, readdir, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSync, Visitor } from 'vite';
import { verifyCoreImportPolicy } from './core-import-policy.mjs';

const nameOf = (node) => node?.name ?? node?.value;

/** 실행하지 않고 import 형태와 실제로 참조하는 공개 이름을 수집합니다. */
export function collectOwpImports(file, content) {
  const parsed = parseSync(file, content);
  if (parsed.errors.length) throw new SyntaxError(`Import 구문을 읽을 수 없습니다: ${file}`);
  const imports = [];
  const namespaces = new Map();
  const add = (node, kind, names = []) => {
    const specifier = node.source?.value;
    if (!specifier?.startsWith('@owp/')) return;
    const entry = { file, line: content.slice(0, node.start).split('\n').length, specifier, kind, names };
    imports.push(entry);
    return entry;
  };
  new Visitor({
    ImportDeclaration(node) {
      const entry = add(node, 'import', node.specifiers.flatMap((item) => {
        if (item.type === 'ImportNamespaceSpecifier') return [];
        return [{ name: item.type === 'ImportDefaultSpecifier' ? 'default' : nameOf(item.imported), typeOnly: node.importKind === 'type' || item.importKind === 'type' }];
      }));
      if (entry) for (const item of node.specifiers) {
        if (item.type === 'ImportNamespaceSpecifier') namespaces.set(item.local.name, { entry, typeOnly: node.importKind === 'type' });
      }
    },
    ExportNamedDeclaration(node) {
      add(node, 're-export', node.specifiers.map((item) => ({ name: nameOf(item.local), typeOnly: node.exportKind === 'type' || item.exportKind === 'type' })));
    },
    ExportAllDeclaration(node) { add(node, 're-export-all'); },
    ImportExpression(node) { add(node, 'dynamic-import'); },
    CallExpression(node) {
      const callee = node.callee;
      if (callee.type !== 'MemberExpression' || nameOf(callee.property) !== 'then' || callee.object.type !== 'ImportExpression') return;
      const callback = node.arguments[0];
      const parameter = callback?.params?.[0];
      if (parameter?.type !== 'ObjectPattern') return;
      add(callee.object, 'dynamic-selection', parameter.properties.flatMap((item) => item.type === 'Property' ? [{ name: nameOf(item.key), typeOnly: false }] : []));
    },
  }).visit(parsed.program);
  new Visitor({
    MemberExpression(node) {
      if (node.object.type !== 'Identifier' || node.computed && node.property.type !== 'Literal') return;
      const namespace = namespaces.get(node.object.name);
      if (namespace) namespace.entry.names.push({ name: nameOf(node.property), typeOnly: namespace.typeOnly });
    },
    TSQualifiedName(node) {
      if (node.left.type !== 'Identifier') return;
      const namespace = namespaces.get(node.left.name);
      if (namespace) namespace.entry.names.push({ name: nameOf(node.right), typeOnly: true });
    },
  }).visit(parsed.program);
  return imports;
}

function exportTarget(definition, condition) {
  if (typeof definition === 'string') return condition === 'types' ? undefined : definition;
  if (!definition || typeof definition !== 'object') return undefined;
  if (typeof definition[condition] === 'string') return definition[condition];
  for (const key of condition === 'types' ? ['import', 'default'] : ['import', 'default', 'node']) {
    const result = exportTarget(definition[key], condition);
    if (result) return result;
  }
  return undefined;
}

/** 설치본의 exports·declaration·runtime을 정적으로 대조합니다. 브라우저 모듈은 실행하지 않습니다. */
export async function verifyOwpSourceContracts(root, sources) {
  const require = createRequire(path.join(root, 'package.json'));
  const modules = new Map();
  const entries = new Map();
  async function exportedNames(file) {
    const previous = modules.get(file);
    if (previous) return previous;
    const names = new Set();
    modules.set(file, names);
    const source = await readFile(file, 'utf8');
    const parsed = parseSync(file, source);
    if (parsed.errors.length) throw new SyntaxError(`공개 export를 읽을 수 없습니다: ${file}`);
    for (const statement of parsed.program.body) {
      if (statement.type === 'ExportDefaultDeclaration') names.add('default');
      if (statement.type === 'ExportNamedDeclaration') {
        for (const item of statement.specifiers) names.add(nameOf(item.exported));
        const declaration = statement.declaration;
        if (declaration?.id) names.add(nameOf(declaration.id));
        for (const item of declaration?.declarations ?? []) if (item.id.type === 'Identifier') names.add(item.id.name);
      }
      if (statement.type === 'ExportAllDeclaration') {
        if (statement.exported) names.add(nameOf(statement.exported));
        else if (statement.source.value.startsWith('.')) {
          const specifier = statement.source.value;
          const dependency = file.endsWith('.d.ts')
            ? /\.d\.ts$/.test(specifier) ? specifier : /\.js$/.test(specifier) ? specifier.replace(/\.js$/, '.d.ts') : `${specifier}.d.ts`
            : specifier;
          for (const name of await exportedNames(path.resolve(path.dirname(file), dependency))) if (name !== 'default') names.add(name);
        }
      }
    }
    return names;
  }
  async function entryFor(specifier) {
    if (entries.has(specifier)) return entries.get(specifier);
    const packageName = specifier.split('/').slice(0, 2).join('/');
    const manifestFile = await realpath(require.resolve(`${packageName}/package.json`));
    const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
    const subpath = specifier === packageName ? '.' : `.${specifier.slice(packageName.length)}`;
    const definition = manifest.exports?.[subpath];
    if (!definition) return undefined;
    const directory = path.dirname(manifestFile);
    const types = exportTarget(definition, 'types');
    const runtime = exportTarget(definition, 'import');
    const result = {
      types: types ? await exportedNames(path.resolve(directory, types)) : undefined,
      runtime: runtime && !/\.(?:css|json)$/.test(runtime) ? await exportedNames(path.resolve(directory, runtime)) : undefined,
    };
    if (runtime) await readFile(path.resolve(directory, runtime));
    entries.set(specifier, result);
    return result;
  }
  const imports = sources.flatMap(({ file, content }) => collectOwpImports(file, content));
  const errors = [];
  for (const entry of imports) {
    const contract = await entryFor(entry.specifier);
    if (!contract) { errors.push({ ...entry, reason: 'private-path' }); continue; }
    for (const symbol of entry.names) {
      if (contract.types && !contract.types.has(symbol.name)) errors.push({ ...entry, name: symbol.name, reason: 'missing-declaration' });
      if (!symbol.typeOnly && contract.runtime && !contract.runtime.has(symbol.name)) errors.push({ ...entry, name: symbol.name, reason: 'missing-runtime-export' });
    }
  }
  return { files: sources.length, imports: imports.length, errors: [...errors, ...verifyCoreImportPolicy(imports, sources)] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(import.meta.dirname, '..');
  const files = (await Promise.all(['src', 'mcp', 'scripts', 'tests'].map(async (directory) =>
    (await readdir(path.join(root, directory), { recursive: true })).filter((file) => /\.(?:[cm]?[jt]sx?)$/.test(file)).map((file) => `${directory}/${file}`),
  ))).flat();
  const sources = await Promise.all(files.map(async (file) => ({ file, content: await readFile(path.join(root, file), 'utf8') })));
  const result = await verifyOwpSourceContracts(root, sources);
  if (result.errors.length) {
    for (const error of result.errors) console.error(`${error.file}:${error.line} ${error.specifier} ${error.name ?? ''} (${error.reason}${error.expectedSpecifier ? ` → ${error.expectedSpecifier}` : ''})`);
    process.exitCode = 1;
  } else console.log(`PASS OWP public imports: ${result.imports} imports in ${result.files} sources`);
}
