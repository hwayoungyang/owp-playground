import { existsSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-compiler-api';
import { z } from 'zod';
import { packageArtifactDigest, safePath } from '../distribution/files.ts';
import { DistributionError } from '../distribution/integrity.ts';
import type { CompanyBundle } from '../../mcp/company/bundle.ts';
import { snapshotCompanyFiles } from '../../mcp/company/snapshot.ts';
import { cssTargets, relativeMaterialTarget } from '../distribution/graph.ts';
import { publicPackageBoundary } from './public-packages.ts';
export { toolingRoot } from './public-packages.ts';

const metadataSchema = z.object({ exports: z.unknown(), name: z.string(), version: z.string() });
export function inside(root: string, file: string): boolean {
  return file === root || file.startsWith(`${root}${sep}`);
}

/** 검증한 각 package의 bytes를 export·타입 검사·실행 build가 함께 사용합니다. */
export function snapshotCompanyRuntime(
  bundle: CompanyBundle,
  packageRoots: Readonly<Record<string, string>>,
) {
  const roots: Record<string, string> = {};
  const bytes = new Map<string, Buffer>();
  const directories = new Set<string>();
  for (const [id, suppliedRoot] of Object.entries(packageRoots)) {
    const root = resolve(suppliedRoot);
    const snapshot = snapshotCompanyFiles(root);
    if (packageArtifactDigest(snapshot.files) !== bundle.manifest.packages[id]?.artifactDigest)
      throw new DistributionError(
        'company-runtime-changed',
        '고정한 runtime의 artifact digest가 제공 manifest와 다릅니다.',
      );
    roots[id] = root;
    directories.add(root);
    for (const file of snapshot.files) {
      const full = resolve(root, file.path);
      bytes.set(full, snapshot.read(file.path));
      for (let directory = dirname(full); inside(root, directory); directory = dirname(directory)) {
        directories.add(directory);
        if (directory === root) break;
      }
    }
  }
  return {
    roots: Object.freeze(roots),
    has: (file: string) => bytes.has(resolve(file)),
    read(file: string): Buffer | undefined {
      const content = bytes.get(resolve(file));
      return content ? Buffer.from(content) : undefined;
    },
    requireFile(root: string, file: string): string {
      const full = resolve(file);
      const local = relative(root, full).split(sep).join('/');
      if (
        !inside(root, full) ||
        !local ||
        local.split('/').includes('node_modules') ||
        !bytes.has(full)
      )
        throw new DistributionError(
          'company-runtime-escape',
          '고정된 package snapshot의 포함 파일만 사용할 수 있습니다.',
        );
      return full;
    },
    directoryExists: (directory: string) => directories.has(resolve(directory)),
    getDirectories: (directory: string) =>
      [...directories].filter((child) => dirname(child) === resolve(directory)),
  };
}
export type CompanyRuntimeSnapshot = ReturnType<typeof snapshotCompanyRuntime>;

/** package export의 명시적인 exact key만 허용하며 wildcard·내부 경로 fallback을 거부합니다. */
export function companyPackageResolver(
  bundle: CompanyBundle,
  packageRoots: Readonly<Record<string, string>>,
  runtime: CompanyRuntimeSnapshot = snapshotCompanyRuntime(bundle, packageRoots),
) {
  const roots = runtime.roots;
  const metadataById = new Map<string, z.infer<typeof metadataSchema>>();
  for (const [id, root] of Object.entries(roots)) {
    const pkg = bundle.manifest.packages[id];
    const bytes = runtime.read(runtime.requireFile(root, resolve(root, 'package.json')));
    if (!bytes)
      throw new DistributionError('company-runtime-missing', '고정된 package metadata가 없습니다.');
    const metadata = metadataSchema.parse(JSON.parse(bytes.toString('utf8')));
    if (!pkg || metadata.name !== pkg.packageName || metadata.version !== pkg.version)
      throw new DistributionError(
        'company-package-identity',
        '실행 package의 이름·버전이 다릅니다.',
      );
    metadataById.set(id, metadata);
  }
  return {
    roots,
    resolve(specifier: string, mode: 'types' | 'runtime'): string {
      const [scope, id, ...segments] = specifier.split('/');
      const pkg = id ? bundle.manifest.packages[id] : undefined;
      const root = id ? roots[id] : undefined;
      if (
        scope !== '@owp' ||
        !id ||
        !pkg ||
        !root ||
        segments.some((part) => !part || part === '.' || part === '..' || /[\\%?#:]/.test(part))
      )
        throw new DistributionError(
          'company-package-excluded',
          '명시적으로 제공된 company package만 resolve할 수 있습니다.',
        );
      const metadata = metadataById.get(id);
      if (!metadata)
        throw new DistributionError(
          'company-package-identity',
          '실행 package의 이름·버전이 다릅니다.',
        );
      const key = segments.length ? `./${segments.join('/')}` : '.';
      let target: unknown = metadata.exports;
      if (
        target !== null &&
        typeof target === 'object' &&
        !Array.isArray(target) &&
        Object.keys(target).some((item) => item.startsWith('.'))
      )
        target = Object.entries(target).find(([name]) => name === key)?.[1];
      else if (key !== '.') target = undefined;
      function select(value: unknown): string | undefined {
        if (typeof value === 'string') return value;
        if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
        const entries = Object.entries(value);
        for (const condition of mode === 'types' ? ['types'] : ['browser', 'import', 'default']) {
          const child = entries.find(([name]) => name === condition)?.[1];
          const selected = select(child);
          if (selected) return selected;
        }
        return undefined;
      }
      const selected = select(target);
      if (
        !selected?.startsWith('./') ||
        selected.includes('*') ||
        selected.includes('?') ||
        selected.includes('#')
      )
        throw new DistributionError(
          'company-export-excluded',
          '검토된 exact package export가 없습니다.',
        );
      const file = runtime.requireFile(root, resolve(root, selected.slice(2)));
      if (mode === 'types' && !/\.d\.[cm]?ts$/.test(file))
        throw new DistributionError(
          'company-types-required',
          '실제 projected declaration export가 필요합니다.',
        );
      return file;
    },
  };
}

export function checkExecutionTypes(
  bundle: CompanyBundle,
  sourceRoot: string,
  packageRoots: Readonly<Record<string, string>>,
  entryFile: string,
  runtime: CompanyRuntimeSnapshot = snapshotCompanyRuntime(bundle, packageRoots),
): void {
  const resolver = companyPackageResolver(bundle, packageRoots, runtime);
  const options: ts.CompilerOptions = {
    noEmit: true,
    strict: true,
    skipLibCheck: false,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    allowImportingTsExtensions: true,
    esModuleInterop: true,
    types: ['react', 'react-dom'],
  };
  const host = ts.createCompilerHost(options);
  const publicPackages = publicPackageBoundary(bundle.spec.externalPackages, true);
  const source = resolve(sourceRoot);
  const reviewedFiles = new Map([
    ...bundle.spec.modules.map((file): [string, Buffer] => [
      resolve(source, 'materials', file.path),
      bundle.read(`materials/${file.path}`),
    ]),
    [resolve(entryFile), Buffer.from(executionTypeEntry(bundle))],
  ]);
  const reviewedDirectories = new Set<string>();
  for (const file of reviewedFiles.keys())
    for (let directory = dirname(file); inside(source, directory); directory = dirname(directory)) {
      reviewedDirectories.add(directory);
      if (directory === source) break;
    }
  const assertSource = (file: string) => {
    const full = resolve(file);
    if (reviewedFiles.has(full)) return;
    if (inside(source, full))
      throw new DistributionError(
        'company-execution-source',
        '타입 검사는 고정된 검토 자료와 생성 진입점만 사용할 수 있습니다.',
      );
    const root = Object.values(resolver.roots).find((root) => inside(root, file));
    if (root) {
      runtime.requireFile(root, file);
      return;
    }
    publicPackages.assertFile(file);
  };
  const companyFile = (file: string) =>
    Object.values(resolver.roots).some((root) => inside(root, resolve(file)));
  const readFile = host.readFile;
  const fileExists = host.fileExists;
  const directoryExists = host.directoryExists;
  const getDirectories = host.getDirectories;
  const realpath = host.realpath;
  host.readFile = (file) => {
    const content = reviewedFiles.get(resolve(file));
    if (content) return content.toString('utf8');
    if (inside(source, resolve(file))) return undefined;
    return companyFile(file) ? runtime.read(file)?.toString('utf8') : readFile(file);
  };
  host.fileExists = (file) =>
    reviewedFiles.has(resolve(file)) ||
    (inside(source, resolve(file))
      ? false
      : companyFile(file)
        ? runtime.has(file)
        : fileExists(file));
  host.directoryExists = (directory) =>
    inside(source, resolve(directory))
      ? reviewedDirectories.has(resolve(directory))
      : companyFile(directory)
        ? runtime.directoryExists(directory)
        : (directoryExists?.(directory) ?? false);
  host.getDirectories = (directory) =>
    inside(source, resolve(directory))
      ? [...reviewedDirectories].filter((child) => dirname(child) === resolve(directory))
      : companyFile(directory)
        ? runtime.getDirectories(directory)
        : (getDirectories?.(directory) ?? []);
  host.realpath = (file) =>
    inside(source, resolve(file)) || reviewedFiles.has(resolve(file)) || companyFile(file)
      ? resolve(file)
      : (realpath?.(file) ?? file);
  const getSourceFile = host.getSourceFile;
  host.getSourceFile = (file, languageVersion, ...args) => {
    assertSource(file);
    const reviewed = reviewedFiles.get(resolve(file));
    if (reviewed)
      return ts.createSourceFile(file, reviewed.toString('utf8'), languageVersion, true);
    if (companyFile(file)) {
      const content = runtime.read(file);
      return content
        ? ts.createSourceFile(file, content.toString('utf8'), languageVersion, true)
        : undefined;
    }
    return getSourceFile(file, languageVersion, ...args);
  };
  host.resolveModuleNames = (names, containingFile) =>
    names.map((specifier) => {
      const reviewed = bundle.spec.modules.find(
        (module) => resolve(sourceRoot, 'materials', module.path) === resolve(containingFile),
      );
      const dependency = reviewed?.dependencies[specifier];
      if (reviewed && specifier.startsWith('.') && dependency?.kind !== 'file')
        throw new DistributionError('company-import-unreviewed', '검토된 import 대상이 없습니다.');
      if (dependency?.kind === 'file') {
        const file = resolve(sourceRoot, 'materials', dependency.path);
        if (!reviewedFiles.has(file))
          throw new DistributionError(
            'company-import-unreviewed',
            '포함된 import 대상이 없습니다.',
          );
        const extensions: Readonly<Record<string, ts.Extension>> = {
          '.ts': ts.Extension.Ts,
          '.tsx': ts.Extension.Tsx,
          '.js': ts.Extension.Js,
          '.jsx': ts.Extension.Jsx,
          '.mts': ts.Extension.Mts,
          '.cts': ts.Extension.Cts,
          '.mjs': ts.Extension.Mjs,
          '.cjs': ts.Extension.Cjs,
          '.json': ts.Extension.Json,
        };
        const extension = file.endsWith('.d.ts') ? ts.Extension.Dts : extensions[extname(file)];
        return extension
          ? { resolvedFileName: file, extension, isExternalLibraryImport: false }
          : undefined;
      }
      if (specifier.startsWith('@owp/'))
        return {
          resolvedFileName: resolver.resolve(specifier, 'types'),
          extension: ts.Extension.Dts,
          isExternalLibraryImport: true,
        };
      const externalName = specifier
        .split('/')
        .slice(0, specifier.startsWith('@') ? 2 : 1)
        .join('/');
      const fallback =
        bundle.spec.externalPackages.includes(externalName) ||
        ['react', 'react-dom'].includes(externalName);
      const result =
        ts.resolveModuleName(specifier, containingFile, options, host).resolvedModule ??
        (fallback
          ? ts.resolveModuleName(specifier, fileURLToPath(import.meta.url), options, host)
              .resolvedModule
          : undefined);
      if (result) assertSource(result.resolvedFileName);
      return result;
    });
  const program = ts.createProgram(
    [
      entryFile,
      ...bundle.spec.modules
        .filter((file) => /\.[cm]?[jt]sx?$/.test(file.path))
        .map((file) => resolve(sourceRoot, 'materials', file.path)),
    ],
    options,
    host,
  );
  for (const source of program.getSourceFiles()) assertSource(source.fileName);
  const errors = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (errors.length)
    throw new DistributionError(
      'company-execution-typecheck',
      ts.formatDiagnostics(errors, {
        getCurrentDirectory: () => sourceRoot,
        getCanonicalFileName: (file) => relative(sourceRoot, file),
        getNewLine: () => '\n',
      }),
    );
}

export function assertStaticRuntime(file: string, source: string): void {
  if (!/\.[cm]?[jt]sx?$/.test(file)) return;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          ['eval', 'Function', 'require'].includes(node.expression.text)) ||
        (ts.isPropertyAccessExpression(node.expression) &&
          ['glob', 'globEager'].includes(node.expression.name.text)))
    )
      throw new DistributionError(
        'company-runtime-dynamic',
        '고객 runtime의 동적 loader는 별도 검토와 정적 adapter가 필요합니다.',
      );
    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ['Worker', 'SharedWorker', 'URL', 'Function'].includes(node.expression.text)
    )
      throw new DistributionError(
        'company-runtime-dynamic',
        '고객 runtime의 동적 target은 지원하지 않습니다.',
      );
    ts.forEachChild(node, visit);
  }
  visit(ast);
}

export function assertRuntimeCss(input: {
  readonly root: string;
  readonly file: string;
  readonly source: string;
  readonly includes: (file: string) => boolean;
}): void {
  if (!input.file.endsWith('.css')) return;
  for (const target of cssTargets(input.source)) {
    const relativeFile = relative(input.root, input.file).split(sep).join('/');
    const asset = relativeMaterialTarget(relativeFile, target);
    if (!asset || !input.includes(resolve(input.root, asset)))
      throw new DistributionError(
        'company-css-excluded',
        'CSS는 같은 package에 포함된 정적 asset만 참조할 수 있습니다.',
      );
  }
}

export function requirePackageFile(root: string, file: string): string {
  const relativeFile = relative(root, file).split(sep).join('/');
  if (
    !existsSync(file) ||
    !inside(root, file) ||
    !relativeFile ||
    relativeFile.split('/').includes('node_modules')
  )
    throw new DistributionError(
      'company-runtime-escape',
      'package 내부의 실제 파일만 사용할 수 있습니다.',
    );
  return safePath(root, relativeFile);
}

export function executionTypeEntry(bundle: CompanyBundle): string {
  return `import {createElement} from 'react';\n${bundle.spec.executionAdapters
    .map(
      (adapter, index) =>
        `import {${adapter.exportName} as Example${index}} from ${JSON.stringify(`./materials/${adapter.entry}`)};\ncreateElement(Example${index},${JSON.stringify(adapter.props)});`,
    )
    .join('\n')}\n`;
}

export function resolveReviewedRelative(importer: string, specifier: string): string {
  if (
    !specifier.startsWith('.') ||
    specifier.includes('?') ||
    specifier.includes('#') ||
    specifier.includes('\\')
  )
    throw new DistributionError('company-module-query', '검토된 정적 상대 import가 필요합니다.');
  return resolve(dirname(importer), specifier);
}
