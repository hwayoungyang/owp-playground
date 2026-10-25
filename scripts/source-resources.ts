import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseSync, Visitor } from 'vite';
import { z } from 'zod';
import { exampleSourcePath } from '../src/features/code/source-paths.ts';
import { withPublicBase } from '../src/features/releases/model/urls.ts';

export type SourceResource = {
  readonly path: string;
  readonly content: string;
  readonly sha256: string;
  readonly dependencies: readonly string[];
  readonly externalImports: readonly string[];
};

export class SourceDependencyError extends Error {
  readonly importer: string;
  readonly specifier: string;
  constructor(importer: string, specifier: string) {
    super(`소스 의존성을 찾을 수 없습니다: ${importer} → ${specifier}`);
    this.importer = importer;
    this.specifier = specifier;
    this.name = 'SourceDependencyError';
  }
}

type ImportReference = { readonly specifier: string; readonly runtime: boolean };

function sourceImports(file: string, content: string): readonly ImportReference[] {
  if (file.endsWith('.json')) {
    JSON.parse(content);
    return [];
  }
  if (file.endsWith('.css')) {
    return [...content.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(
      /@import\s+(?:url\(\s*)?["']([^"']+)["']/g,
    )].flatMap((match) => match[1] ? [{ specifier: match[1], runtime: true }] : []);
  }
  const parsed = parseSync(file, content);
  if (parsed.errors.length > 0) {
    throw new SyntaxError(`${file}: ${parsed.errors.map((error) => error.message).join('; ')}`);
  }
  const references: ImportReference[] = [];
  new Visitor({
    ImportDeclaration(node) {
      references.push({
        specifier: node.source.value,
        runtime: node.importKind !== 'type' && (node.specifiers.length === 0 || node.specifiers.some(
          (specifier) => specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type',
        )),
      });
    },
    ExportNamedDeclaration(node) {
      if (!node.source) return;
      references.push({
        specifier: node.source.value,
        runtime: node.exportKind !== 'type' && (node.specifiers.length === 0 || node.specifiers.some((specifier) => specifier.exportKind !== 'type')),
      });
    },
    ExportAllDeclaration(node) {
      references.push({ specifier: node.source.value, runtime: node.exportKind !== 'type' });
    },
    ImportExpression(node) {
      if (node.source.type === 'Literal' && typeof node.source.value === 'string')
        references.push({ specifier: node.source.value, runtime: true });
    },
  }).visit(parsed.program);
  return references;
}

/** 실행 파일과 타입·스타일 의존성을 같은 원본에서 읽습니다. ?raw는 코드 표시용 문자열이므로 제외합니다. */
export async function readSourceResources(root: string): Promise<ReadonlyMap<string, SourceResource>> {
  const directory = path.join(root, 'src');
  const files = (await readdir(directory, { recursive: true }))
    .map((file) => file.split(path.sep).join('/'))
    .filter((file) => /\.(?:ts|tsx|css|json)$/.test(file)).sort();
  const known = new Set(files);
  const resources = await Promise.all(files.map(async (file) => {
    const bytes = await readFile(path.join(directory, file));
    const content = bytes.toString('utf8');
    const dependencies = new Set<string>();
    const externalImports = new Set<string>();
    for (const { specifier, runtime } of sourceImports(file, content)) {
      const [source, query] = specifier.split('?');
      if (!source || new URLSearchParams(query).has('raw')) continue;
      if (!source.startsWith('.')) {
        if (runtime && !source.startsWith('virtual:')) externalImports.add(specifier);
        continue;
      }
      const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), source));
      const dependency = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
        .find((candidate) => known.has(candidate));
      if (!dependency) throw new SourceDependencyError(`/src/${file}`, specifier);
      dependencies.add(`/src/${dependency}`);
    }
    return [`/src/${file}`, {
      path: `/src/${file}`, content,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      dependencies: [...dependencies].sort(),
      externalImports: [...externalImports].sort(),
    }] as const;
  }));
  return new Map(resources);
}

export function sourceDependencyGraph(resources: ReadonlyMap<string, SourceResource>) {
  return Object.fromEntries([...resources].map(([file, resource]) => [file, resource.dependencies]));
}

function dependencyClosure(entrypoint: string, resources: ReadonlyMap<string, SourceResource>) {
  const visited = new Set<string>();
  function visit(file: string) {
    if (visited.has(file)) return;
    const resource = resources.get(file);
    if (!resource) throw new SourceDependencyError(entrypoint, file);
    visited.add(file);
    resource.dependencies.forEach(visit);
  }
  visit(entrypoint);
  return [...visited].sort().map((file) => {
    const resource = resources.get(file);
    if (!resource) throw new SourceDependencyError(entrypoint, file);
    return resource;
  });
}

const packageSchema = z.object({ version: z.string().min(1) });

export async function installedDependencyVersions(root: string, specifiers: readonly string[]) {
  const packages = [...new Set(specifiers.map((specifier) =>
    specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/'),
  ))].sort();
  return Object.fromEntries(await Promise.all(packages.map(async (name) => {
    const manifest = packageSchema.parse(JSON.parse(
      await readFile(path.join(root, 'node_modules', name, 'package.json'), 'utf8'),
    ));
    return [name, manifest.version] as const;
  })));
}

type SourceCatalogEntry = {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly description: string;
  readonly api: readonly string[];
  readonly package: string;
  readonly source: string;
};

const snippetPath = (file: string) => file.replace(/^\/src\//, '/snippets/');

export async function createPackageSourceManifest(options: {
  readonly root: string;
  readonly catalog: readonly SourceCatalogEntry[];
  readonly resources: ReadonlyMap<string, SourceResource>;
  readonly packageName: string;
  readonly basePath?: string;
  readonly supportFiles?: readonly string[];
}) {
  const sourceUrl = (file: string) => withPublicBase(snippetPath(file), options.basePath ?? '/');
  const samples = options.catalog.map((entry) => {
    const entrypoint = `/src/${exampleSourcePath(entry)}`;
    const files = [...new Map([entrypoint, ...(options.supportFiles ?? [])]
      .flatMap((file) => dependencyClosure(file, options.resources))
      .map((file) => [file.path, file])).values()].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
    return {
      ...entry,
      entrypoint: sourceUrl(entrypoint),
      files: files.map((file) => ({
        path: sourceUrl(file.path),
        sha256: file.sha256,
        dependencies: file.dependencies.map(sourceUrl),
        externalImports: file.externalImports,
      })),
      externalImports: [...new Set(files.flatMap((file) => file.externalImports))].sort(),
    };
  });
  const dependencyVersions = await installedDependencyVersions(options.root, [
    options.packageName, ...samples.flatMap((sample) => sample.externalImports),
  ]);
  return {
    version: 1,
    package: options.packageName,
    packageVersion: dependencyVersions[options.packageName],
    dependencyVersions,
    samples,
  };
}

export function createDataGridSourceManifest(options: Omit<Parameters<typeof createPackageSourceManifest>[0], 'packageName'>) {
  return createPackageSourceManifest({ ...options, packageName: '@owp/datagrid' });
}
