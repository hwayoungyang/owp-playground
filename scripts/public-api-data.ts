import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript-compiler-api';
import { componentRuntimeDefaults } from './components-runtime-defaults.ts';
import { verifiedComponentDefaults } from './components-verified-defaults.ts';
import { z } from 'zod';
import { createComponentsApiCompiler, symbolDeclaration } from './components-api-compiler.ts';
import { readMember, readPropsVariants, readSignatures } from './components-api-shapes.ts';
import { declarationText, documentation, memberSource, readableType } from './components-api-text.ts';
import { readCoreNodeFunctions } from './public-api-node.ts';
import { publicDescription } from '../src/features/public-api/descriptions.ts';
import { publicApiWrapper } from '../src/features/public-api/wrapper-policy.ts';
import { componentsCatalog } from '../src/playgrounds/components/catalog.ts';
import { coreCatalog } from '../src/playgrounds/core/catalog.ts';
import { chartCatalog } from '../src/playgrounds/charts/catalog.ts';
import { gridCatalog } from '../src/playgrounds/datagrid/catalog.ts';
import type { PublicSymbol } from './components-api-compiler.ts';
import type { PublicApiEntry, PublicApiGroup, PublicApiKind, PublicApiPackageData, PublicApiPackageId, PublicApiSignature } from '../src/features/public-api/types.ts';

const manifestSchema = z.object({ exports: z.record(z.string(), z.union([z.string(), z.object({ types: z.string().optional(), import: z.string().optional() })])) });
const catalogs = [...componentsCatalog, ...coreCatalog, ...chartCatalog, ...gridCatalog];

function exampleImports(root: string) {
  const cache = new Map<string, ReadonlySet<string>>();
  const read = (file: string, visiting: Set<string>): ReadonlySet<string> => {
    const cached = cache.get(file);
    if (cached) return cached;
    if (visiting.has(file) || !existsSync(file)) return new Set();
    visiting.add(file);
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const symbols = new Set<string>();
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const module = statement.moduleSpecifier.text;
      const packageName = module.match(/^@owp\/[^/]+/)?.[0];
      if (packageName) {
        if (statement.importClause?.name) symbols.add(`${packageName}:default`);
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) for (const element of bindings.elements) symbols.add(`${packageName}:${element.propertyName?.text ?? element.name.text}`);
      }
      if (!module.startsWith('.')) continue;
      const base = resolve(dirname(file), module);
      if (!base.startsWith(resolve(root, 'src') + '/')) continue;
      const dependency = [base, `${base}.tsx`, `${base}.ts`, `${base}/index.ts`, `${base}/index.tsx`].find((candidate) => /\.[cm]?[jt]sx?$/.test(candidate) && existsSync(candidate));
      if (dependency) for (const symbol of read(dependency, visiting)) symbols.add(symbol);
    }
    visiting.delete(file);
    cache.set(file, symbols);
    return symbols;
  };
  return catalogs.filter((entry) => entry.kind !== 'guide').map((entry) => ({
    entry,
    symbols: read(resolve(root, `src/playgrounds/${entry.package.replace('@owp/', '')}/${entry.source}`), new Set()),
    direct: readFileSync(resolve(root, `src/playgrounds/${entry.package.replace('@owp/', '')}/${entry.source}`), 'utf8'),
  }));
}

function kindOf(checker: ts.TypeChecker, exported: PublicSymbol): PublicApiKind {
  const { symbol, name } = exported;
  if (!(symbol.flags & ts.SymbolFlags.Value) || exported.typeOnlyImports?.length === exported.imports.length) return 'type';
  const declaration = symbolDeclaration(symbol);
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  if (type.getProperty('Provider') && type.getProperty('Consumer')) return 'context';
  const call = type.getCallSignatures()[0];
  const constructor = type.getConstructSignatures()[0];
  const returnText = call && checker.typeToString(call.getReturnType());
  const reactClass = constructor?.getReturnType().getProperty('props') && constructor.getReturnType().getProperty('render');
  if (reactClass || (call && /^[A-Z]/.test(name) && (/ReactElement|ReactNode|(?:^|\.)Element(?:\s*\||$)/.test(returnText ?? '') || Boolean(type.getProperty('$$typeof'))))) return 'component';
  if (constructor) return 'class';
  if (call) return /^use[A-Z]/.test(name) ? 'hook' : 'function';
  return 'value';
}

const groups = { component: 'components', hook: 'hooks', function: 'utils', class: 'utils', context: 'contexts', value: 'values', type: 'types', asset: 'assets' } as const satisfies Record<PublicApiKind, PublicApiGroup>;

function members(checker: ts.TypeChecker, type: ts.Type, owner: ts.Symbol) {
  const resolved = checker.getNonNullableType(type);
  if (!(resolved.flags & ts.TypeFlags.Object) || checker.isArrayType(resolved) || checker.isTupleType(resolved)) return [];
  return resolved.getProperties().filter((property) => !property.declarations?.some((declaration) => {
    const hidden = ts.canHaveModifiers(declaration) && ts.getModifiers(declaration)?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword);
    const privateName = (ts.isPropertyDeclaration(declaration) || ts.isMethodDeclaration(declaration) || ts.isGetAccessorDeclaration(declaration) || ts.isSetAccessorDeclaration(declaration)) && ts.isPrivateIdentifier(declaration.name);
    return hidden || privateName;
  })).map((property) => readMember(checker, property, owner));
}

function signaturesOf(checker: ts.TypeChecker, symbol: ts.Symbol, kind: PublicApiKind): readonly PublicApiSignature[] {
  const declaration = symbolDeclaration(symbol);
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const signatures = kind === 'class' ? type.getConstructSignatures() : type.getCallSignatures();
  const plain = kind === 'class' ? [] : readSignatures(checker, symbol);
  return signatures.map((signature, index) => ({
    declaration: checker.signatureToString(signature, declaration, ts.TypeFormatFlags.NoTruncation),
    parameters: plain[index]?.parameters ?? signature.parameters.map((parameter) => ({ name: parameter.name, type: readableType(checker, checker.getTypeOfSymbolAtLocation(parameter, declaration), declaration), optional: Boolean(parameter.flags & ts.SymbolFlags.Optional), rest: false, description: documentation(checker, parameter) })),
    returnType: readableType(checker, signature.getReturnType(), declaration),
    returnDescription: plain[index]?.returnDescription ?? '',
    parameterMembers: signature.parameters.map((parameter, parameterIndex) => ({ name: plain[index]?.parameters[parameterIndex]?.name ?? parameter.name, members: members(checker, checker.getTypeOfSymbolAtLocation(parameter, signature.getDeclaration() ?? declaration), symbol) })),
    returnMembers: members(checker, signature.getReturnType(), symbol),
  }));
}

function usageOf(exported: PublicSymbol, kind: PublicApiKind, importStatement: string, hasProps: boolean): Pick<PublicApiEntry, 'usage' | 'usageKind'> {
  const { name } = exported;
  const local = name === 'default' ? 'publicDefault' : name;
  switch (kind) {
    case 'component':
      return { usageKind: 'component', usage: hasProps ? `${importStatement}\nimport type { ComponentProps } from 'react';\n\nexport function Example(props: ComponentProps<typeof ${local}>) {\n  return <${local} {...props} />;\n}` : `${importStatement}\n\nexport function Example() {\n  return <${local} />;\n}` };
    case 'hook':
    case 'function':
    case 'class': {
      const args = kind === 'class' ? 'ConstructorParameters' : 'Parameters';
      const functionName = kind === 'hook' ? 'useExample' : 'example';
      return { usageKind: 'call', usage: `${importStatement}\n\nexport function ${functionName}(...args: ${args}<typeof ${local}>) {\n  return ${kind === 'class' ? 'new ' : ''}${local}(...args);\n}` };
    }
    case 'context':
      return { usageKind: 'call', usage: `${importStatement}\nimport { useContext } from 'react';\n\nexport function useExample() {\n  return useContext(${local});\n}` };
    case 'type':
      return { usageKind: 'type', usage: `export type { ${name} as Example } from '${exported.imports[0]}';` };
    case 'value':
      return { usageKind: 'value', usage: `${importStatement}\n\nconsole.log(${local});` };
    case 'asset':
      return { usageKind: 'asset', usage: importStatement };
    default:
      return assertNever(kind);
  }
}

function assertNever(value: never): never { throw new TypeError(`Unknown public API kind: ${String(value)}`); }

export function readPublicApiPackage(root: string, id: PublicApiPackageId): PublicApiPackageData {
  const packageName = `@owp/${id}`;
  const compiler = createComponentsApiCompiler(root, packageName);
  const { checker } = compiler;
  const runtimeDefaults = componentRuntimeDefaults(compiler.runtimeEntryPoints);
  const verifiedDefaults = verifiedComponentDefaults(root, id, compiler.packageVersion);
  const exampleSources = exampleImports(root);
  const nodeFunctions = id === 'core' ? readCoreNodeFunctions(root) : new Map<string, PublicApiSignature>();
  const entries: PublicApiEntry[] = [];
  for (const [name, records] of compiler.exports) {
    if (publicApiWrapper(id, name)) continue;
    for (const exported of records) {
      const nodeFunction = exported.imports.some((module) => module.includes('/vite/')) ? nodeFunctions.get(name) : undefined;
      const kind = nodeFunction ? 'function' : kindOf(checker, exported);
      const group = kind === 'value' && (exported.imports.some((module) => module.endsWith('/constants')) || /^[A-Z][A-Z0-9_]*$/.test(name)) ? 'constants' : groups[kind];
      const declaration = symbolDeclaration(exported.symbol);
      const symbolId = records.length === 1 ? name : `${exported.imports[0]}#${name}`;
      const modules = nodeFunction ? [...exported.imports, '@owp/core/vite/owpCoreAssetsPlugin.cjs'] : exported.imports;
      const imports = modules.map((module) => module.endsWith('.cjs') ? `const { ${name} } = require('${module}');` : name === 'default' ? `import publicDefault from '${module}';` : `import${kind === 'type' || exported.typeOnlyImports?.includes(module) ? ' type' : ''} { ${name} } from '${module}';`);
      const defaults = kind === 'component' ? runtimeDefaults(name) : undefined;
      const propsVariants = kind === 'component' ? readPropsVariants(checker, exported.symbol).map((variant) => ({ ...variant, props: variant.props.map((prop) => ({ ...prop, defaultValue: prop.requirement === 'unavailable' ? null : (prop.requirement === 'optional' ? defaults?.get(prop.name)?.value ?? verifiedDefaults[name]?.[prop.name] : undefined) ?? prop.defaultValue })) })) : [];
      entries.push({
        id: `${packageName}:${symbolId}`, name, packageId: id, kind, group, modules,
        ...(records.length > 1 ? { label: `${name} (${exported.imports[0]})` } : {}),
        description: publicDescription(name, exported.imports, documentation(checker, exported.symbol)), owner: memberSource(declaration).split(' · ')[0] ?? packageName,
        exampleIds: exampleSources.filter(({entry, symbols, direct}) => entry.package === packageName && symbols.has(`${packageName}:${name}`) && direct.includes(name)).map(({entry}) => entry.id),
        imports, declaration: declarationText(exported.symbol),
        propsVariants,
        signatures: nodeFunction ? [nodeFunction] : kind === 'function' || kind === 'hook' || kind === 'class' ? signaturesOf(checker, exported.symbol, kind) : [],
        valueType: kind === 'component' ? null : readableType(checker, kind === 'type' ? checker.getDeclaredTypeOfSymbol(exported.symbol) : checker.getTypeOfSymbolAtLocation(exported.symbol, declaration), declaration),
        examples: exampleSources.filter(({ entry, symbols }) => symbols.has(`${packageName}:${name}`) || entry.api.some((api) => (entry.package === packageName && api === name) || api === `${packageName}:${name}`)).sort((left, right) => Number(right.direct.includes(name)) - Number(left.direct.includes(name))).map(({ entry }) => ({packageId: entry.package.replace('@owp/', ''), id: entry.id, title: entry.title, source: entry.source})),
        ...usageOf(exported, kind, imports.find((_, index) => !exported.typeOnlyImports?.includes(exported.imports[index] ?? '')) ?? imports[0] ?? '', propsVariants.length > 0),
        ...(nodeFunction ? { javascript: true, usageKind: 'documented' as const, usage: `${imports[0]}\n\n${name === 'owpCoreAssetsPlugin' ? 'export default { plugins: owpCoreAssetsPlugin() };' : `console.log(${name}());`}` } : {}),
        ...(id === 'charts' && name === 'mergeChartOptions' ? { usageKind: 'documented' as const, usage: `${imports[0]}\n\nconst options = mergeChartOptions<'bar'>({ responsive: true }, undefined);\nconsole.log(options);` } : {}),
      });
    }
  }
  const manifest = manifestSchema.parse(JSON.parse(readFileSync(resolve(root, `node_modules/${packageName}/package.json`), 'utf8')));
  const entrypoints = Object.entries(manifest.exports).map(([subpath, target]) => {
    const module = subpath === '.' ? packageName : `${packageName}${subpath.slice(1)}`;
    const symbols = entries.filter((entry) => entry.modules.includes(module)).map((entry) => entry.id);
    if (!symbols.length) {
      const asset = typeof target === 'string' || !target.types;
      entries.push({ id: `${packageName}:entrypoint:${subpath}`, name: module, packageId: id, kind: 'asset', group: 'assets', modules: [module], description: '', owner: packageName, imports: [], declaration: JSON.stringify(target, null, 2), propsVariants: [], signatures: [], valueType: null, examples: [], usage: module.endsWith('.css') ? `import '${module}';` : module.endsWith('package.json') ? `import manifest from '${module}' with { type: 'json' };\n\nconsole.log(manifest.version);` : `import '${module}';`, usageKind: 'asset' });
      if (!asset && !module.endsWith('/types')) symbols.push(entries.at(-1)?.id ?? '');
    }
    return { name: module, symbols };
  });
  return { id, version: compiler.packageVersion, entries: entries.sort((left, right) => left.name.localeCompare(right.name)), entrypoints };
}
