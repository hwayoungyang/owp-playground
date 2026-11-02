import { readFileSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript-compiler-api';
import { z } from 'zod';

const packageManifest = z.object({
  version: z.string(),
  exports: z.record(z.string(), z.union([z.string(), z.object({ types: z.string().optional(), import: z.string().optional() })])),
});

export class ComponentsApiError extends Error {
  constructor(message: string) {
    super(`Components API: ${message}`);
    this.name = 'ComponentsApiError';
  }
}

export type PublicSymbol = {
  readonly name: string;
  readonly symbol: ts.Symbol;
  readonly imports: readonly string[];
  readonly typeOnlyImports?: readonly string[];
};

export type ComponentsApiCompiler = {
  readonly checker: ts.TypeChecker;
  readonly packageVersion: string;
  readonly exports: ReadonlyMap<string, readonly PublicSymbol[]>;
  readonly publicTypes: ReadonlyMap<ts.Symbol, PublicSymbol>;
  readonly watchFiles: readonly string[];
  readonly runtimeEntryPoints: readonly string[];
};

export function canonicalSymbol(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

export function symbolDeclaration(symbol: ts.Symbol): ts.Declaration {
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
  if (!declaration) throw new ComponentsApiError(`${symbol.name}의 선언을 찾을 수 없습니다.`);
  return declaration;
}

export function createComponentsApiCompiler(
  root: string,
  packageName = '@owp/components',
): ComponentsApiCompiler {
  if (!/^@owp\/[a-z][a-z0-9-]*$/.test(packageName))
    throw new ComponentsApiError(`Invalid package name: ${packageName}`);
  const manifestPath = realpathSync(resolve(root, `node_modules/${packageName}/package.json`));
  const manifest = packageManifest.parse(JSON.parse(readFileSync(manifestPath, 'utf8')));
  const modules = Object.entries(manifest.exports).flatMap(([subpath, target]) =>
    (typeof target === 'object' && (target.types || /\.[cm]?js$/.test(target.import ?? ''))) || (typeof target === 'string' && /\.[cm]?js$/.test(target))
      ? [
          {
            path: resolve(dirname(manifestPath), typeof target === 'string' ? target : target.types ?? target.import ?? ''),
            name: subpath === '.' ? packageName : `${packageName}${subpath.slice(1)}`,
          },
        ]
      : [],
  );
  const program = ts.createProgram(
    modules.map((module) => module.path),
    {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      allowJs: true,
    },
  );
  const checker = program.getTypeChecker();
  const exports = new Map<string, PublicSymbol[]>();
  const publicTypes = new Map<ts.Symbol, PublicSymbol>();
  for (const module of modules) {
    const source = program.getSourceFile(module.path);
    const moduleSymbol = source && checker.getSymbolAtLocation(source);
    if (!moduleSymbol)
      throw new ComponentsApiError(`${module.name}의 공개 선언을 해석할 수 없습니다.`);
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      let symbol = canonicalSymbol(checker, exported);
      const binding = symbol.declarations?.[0];
      if (binding && ts.isBindingElement(binding) && ts.isObjectBindingPattern(binding.parent) && ts.isVariableDeclaration(binding.parent.parent)) {
        const initializer = binding.parent.parent.initializer;
        const dependency = initializer && ts.isCallExpression(initializer) && initializer.arguments[0];
        if (dependency && ts.isStringLiteral(dependency) && dependency.text.endsWith('.cjs')) {
          const source = program.getSourceFile(resolve(dirname(binding.getSourceFile().fileName), dependency.text));
          const moduleSymbol = source && checker.getSymbolAtLocation(source);
          const original = moduleSymbol && checker.getExportsOfModule(moduleSymbol).find((candidate) => candidate.name === exported.name);
          if (original) symbol = canonicalSymbol(checker, original);
        }
      }
      if (!symbol.declarations?.length)
        throw new ComponentsApiError(
          `${module.name}의 ${exported.name} export를 해석할 수 없습니다.`,
        );
      const records = exports.get(exported.name) ?? [];
      const existing = records.find((record) => record.symbol === symbol);
      const record = {
        name: exported.name,
        symbol,
        imports: [...(existing?.imports ?? []), module.name],
        typeOnlyImports: [
          ...(existing?.typeOnlyImports ?? []),
          ...(exported.declarations?.some((declaration) =>
            ts.isExportSpecifier(declaration) && (declaration.isTypeOnly || (ts.isExportDeclaration(declaration.parent.parent) && declaration.parent.parent.isTypeOnly)),
          ) ? [module.name] : []),
        ],
      };
      exports.set(exported.name, [...records.filter((item) => item !== existing), record]);
      if (symbol.flags & ts.SymbolFlags.Type && !(symbol.flags & ts.SymbolFlags.Value)) {
        const previous = publicTypes.get(symbol);
        if (previous && previous.name !== record.name)
          throw new ComponentsApiError(`${symbol.name}의 공개 타입 이름이 모호합니다.`);
        publicTypes.set(symbol, record);
      }
    }
  }
  return {
    checker,
    packageVersion: manifest.version,
    exports,
    publicTypes,
    watchFiles: [manifestPath, ...program.getSourceFiles().map((source) => source.fileName)],
    runtimeEntryPoints: [...new Set(Object.values(manifest.exports).flatMap((target) => {
      const file = typeof target === 'string' ? target : target.import;
      return file && /\.[cm]?js$/.test(file) ? [resolve(dirname(manifestPath), file)] : [];
    }))],
  };
}

export function requirePublicSymbol(compiler: ComponentsApiCompiler, name: string): PublicSymbol {
  const records = compiler.exports.get(name);
  const record = records?.[0];
  if (!record || records?.length !== 1)
    throw new ComponentsApiError(`${name}의 공개 export가 없거나 모호합니다.`);
  return record;
}
