import { dirname, posix } from 'node:path';
import ts from 'typescript-compiler-api';
import { z } from 'zod';
import { reviewedCapabilities } from '../../src/distribution/reviewed-content.ts';
import { DistributionError, parseProvidedManifest } from './integrity.ts';
import type { ProvidedManifest } from './integrity.ts';
import { inventoryPackage, readSafeFile } from './files.ts';
import { projectedImportPaths, verifyProjectedPackage } from './runtime-package.ts';

const declarationRecordSchema = z.object({
  id: z.string(), package: z.string(), packageVersion: z.string(), owner: z.string(),
  name: z.string(), path: z.string(), kind: z.string(), imports: z.array(z.string()), related: z.array(z.string()),
  source: z.object({ path: z.string(), line: z.number() }).passthrough(),
}).passthrough();
const declarationResultSchema = z.object({
  version: z.string(), records: z.array(declarationRecordSchema),
  reexports: z.array(z.unknown()), augmentations: z.array(z.unknown()),
  declarationHash: z.string(), runtimeHash: z.string(),
});

function validateDeclarationFiles(packageRoot: string): Readonly<Record<string, unknown>> {
  const metadata = z.object({ exports: z.unknown().optional(), types: z.string().optional(), typings: z.string().optional() })
    .parse(JSON.parse(readSafeFile(packageRoot, 'package.json').toString('utf8')));
  function checkTargets(value: unknown): void {
    if (typeof value === 'string') {
      if (!value.startsWith('./') || value.includes('*'))
        throw new DistributionError('declaration-export-unreviewed', '명시적인 package 내부 export 경로만 지원합니다.');
      readSafeFile(packageRoot, value.slice(2));
    } else if (value !== null && typeof value === 'object') {
      for (const child of Object.values(value)) checkTargets(child);
    } else if (value !== null && value !== undefined)
      throw new DistributionError('declaration-export-invalid', 'package export 경로가 잘못되었습니다.');
  }
  checkTargets(metadata.exports);
  for (const entry of [metadata.types, metadata.typings]) if (entry) readSafeFile(packageRoot, entry.replace(/^\.\//, ''));
  for (const file of inventoryPackage(packageRoot).filter((item) => /\.d\.[cm]?ts$/.test(item.path))) {
    if (!file.path.endsWith('.d.ts'))
      throw new DistributionError('declaration-format-unreviewed', '현재 adapter는 .d.ts 선언만 지원합니다.');
    const content = readSafeFile(packageRoot, file.path).toString('utf8');
    if (/\]\(|\{@link\s/.test(content))
      throw new DistributionError('declaration-link-unreviewed', 'declaration 문서 링크는 별도 검토가 필요합니다.');
    const program = ts.createSourceFile(file.path, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const externalBindings = new Set<string>();
    for (const statement of program.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text.startsWith('.')) continue;
      const clause = statement.importClause;
      if (clause?.name) externalBindings.add(clause.name.text);
      if (clause?.namedBindings) {
        if (ts.isNamespaceImport(clause.namedBindings)) externalBindings.add(clause.namedBindings.name.text);
        else for (const binding of clause.namedBindings.elements) externalBindings.add(binding.name.text);
      }
    }
    if (program.referencedFiles.length || program.typeReferenceDirectives.length)
      throw new DistributionError('declaration-reference-unreviewed', 'reference directive는 별도 검토가 필요합니다.');
    function checkImport(specifier: string, reexport: boolean): void {
      if (!specifier.startsWith('.')) {
        // React 선언은 불투명한 타입 참조로만 보존하며 외부 타입을 읽거나 복제하지 않습니다.
        if (specifier !== 'react' || reexport)
          throw new DistributionError('declaration-external-unreviewed', '외부 declaration 재공개·의존성은 별도 검토가 필요합니다.');
        return;
      }
      const target = posix.normalize(posix.join(dirname(file.path), specifier.endsWith('.d.ts') ? specifier : specifier.endsWith('.js') ? specifier.replace(/\.js$/, '.d.ts') : `${specifier}.d.ts`));
      readSafeFile(packageRoot, target);
    }
    function visit(node: ts.Node): void {
      if (ts.isExportAssignment(node) || (ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)))
        throw new DistributionError('declaration-default-unreviewed', 'default declaration export는 별도 검토가 필요합니다.');
      if (ts.isExportDeclaration(node) && !node.moduleSpecifier && node.exportClause && ts.isNamedExports(node.exportClause) &&
        node.exportClause.elements.some((binding) => externalBindings.has((binding.propertyName ?? binding.name).text)))
        throw new DistributionError('declaration-external-unreviewed', '간접 외부 declaration 재공개는 별도 검토가 필요합니다.');
      if ((ts.isExportDeclaration(node) && node.exportClause && (ts.isNamespaceExport(node.exportClause) ||
        (ts.isNamedExports(node.exportClause) && node.exportClause.elements.some((binding) => binding.propertyName && binding.propertyName.text !== binding.name.text)))) ||
        (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith('.') &&
          node.importClause?.namedBindings && (ts.isNamespaceImport(node.importClause.namedBindings) ||
            node.importClause.namedBindings.elements.some((binding) => binding.propertyName && binding.propertyName.text !== binding.name.text))))
        throw new DistributionError('declaration-alias-unreviewed', '공개 identity를 보존하지 못하는 declaration 별칭·namespace binding은 별도 검토가 필요합니다.');
      if (ts.isModuleDeclaration(node) || ts.isImportEqualsDeclaration(node))
        throw new DistributionError('projected-augmentation-unreviewed', 'module augmentation·namespace·import equals는 별도 검토가 필요합니다.');
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
        if (!ts.isStringLiteral(node.moduleSpecifier))
          throw new DistributionError('declaration-import-unreviewed', '정적인 declaration import가 필요합니다.');
        checkImport(node.moduleSpecifier.text, ts.isExportDeclaration(node));
      }
      if (ts.isImportTypeNode(node)) {
        if (!ts.isLiteralTypeNode(node.argument) || !ts.isStringLiteral(node.argument.literal))
          throw new DistributionError('declaration-import-unreviewed', '정적인 type import가 필요합니다.');
        checkImport(node.argument.literal.text, false);
      }
      ts.forEachChild(node, visit);
    }
    visit(program);
  }
  const exports = z.record(z.string(), z.unknown()).safeParse(metadata.exports);
  return exports.success && Object.keys(exports.data).some((entry) => entry.startsWith('.')) ? exports.data :
    { '.': metadata.exports ?? { types: metadata.types ?? metadata.typings } };
}

/** public import 경로가 capability의 subpath를 결정하며 record.id는 선언 식별자로만 사용합니다. */
function recordCapabilities(record: z.infer<typeof declarationRecordSchema>, packageId: string): readonly string[] {
  return record.imports.map((entry) => {
    if (entry !== record.package && !entry.startsWith(`${record.package}/`))
      throw new DistributionError('declaration-import-invalid', '다른 package의 공개 import 경로입니다.');
    const subpath = entry.slice(record.package.length).replace(/^\//, '');
    return `${packageId}:${subpath ? `${subpath}:` : ''}${record.owner}${record.path ? `.${record.path}` : ''}`;
  });
}

/** 검증된 projected package의 선언을 읽으며 전체판 record를 filtering하지 않습니다. */
export async function readProjectedDeclarations(
  manifest: ProvidedManifest,
  packageRoots: Readonly<Record<string, string>>,
): Promise<Readonly<Record<string, unknown>>> {
  parseProvidedManifest(manifest, manifest.companyId);
  const module = await import(new URL('../api-declarations.mjs', import.meta.url).href);
  const declarations: Record<string, unknown> = {};
  const verifiedGrants = new Set<string>();
  const explicit = new Set<string>([...reviewedCapabilities, ...manifest.features]);
  for (const [id, expected] of Object.entries(manifest.packages)) {
    const packageRoot = packageRoots[id];
    if (!packageRoot) throw new DistributionError('projected-package-missing', '실제 projected package root가 필요합니다.');
    // 이 함수의 직접 호출도 metadata·파일 바이트 검증을 우회할 수 없습니다.
    const { metadata } = verifyProjectedPackage(packageRoot, id, manifest);
    const grants = new Set(metadata.owpDistribution.grantedCapabilities);
    for (const grant of grants) verifiedGrants.add(grant);
    const selectedImports = new Set(projectedImportPaths(metadata));
    const entries = validateDeclarationFiles(packageRoot);
    const omittedEntries = Object.fromEntries(Object.keys(entries).map((entry) => [entry, null]));
    // 전체 reader는 같은 record.id의 imports를 병합할 때 잃을 수 있으므로 export별 원본 view도 검증합니다.
    const views = await Promise.all(Object.entries(entries).map(async ([entry, definition]) => declarationResultSchema.parse(
      await module.readDeclarations(packageRoot, { externalPackages: ['react'], additionalEntries: { ...omittedEntries, [entry]: definition } }),
    )));
    const publicImports = new Map<string, Set<string>>();
    const identities = new Map<string, Set<string>>();
    const identityOf = (record: z.infer<typeof declarationRecordSchema>): string =>
      JSON.stringify([record.id, record.source.path, record.source.line]);
    for (const view of views) for (const record of view.records) {
      const identity = identityOf(record);
      const imports = publicImports.get(identity) ?? new Set<string>();
      for (const entry of record.imports) imports.add(entry);
      publicImports.set(identity, imports);
      const sources = identities.get(record.id) ?? new Set<string>();
      sources.add(identity); identities.set(record.id, sources);
    }
    const parsed = declarationResultSchema.parse(await module.readDeclarations(packageRoot, { externalPackages: ['react'] }));
    const declarationViews = views.map((view) => ({ ...view,
      records: view.records.map((record) => ({ ...record, imports: [...(publicImports.get(identityOf(record)) ?? record.imports)] })),
    }));
    const ordinaryTypes = new Set<string>();
    for (const view of declarationViews) {
      if (view.version !== expected.version || view.records.some((record) =>
        record.package !== expected.packageName || record.packageVersion !== expected.version))
        throw new DistributionError('declaration-package-mismatch', 'declaration의 패키지와 버전이 다릅니다.');
      if (view.reexports.length || view.augmentations.length)
        throw new DistributionError('projected-augmentation-unreviewed', '외부 re-export와 module augmentation은 별도 검토가 필요합니다.');
      const records = new Map(view.records.map((record) => [record.id, record]));
      function includeTypes(record: z.infer<typeof declarationRecordSchema>): void {
        for (const reference of record.related) {
          if ((identities.get(reference)?.size ?? 0) > 1)
            throw new DistributionError('declaration-reference-unreviewed', '서로 다른 공개 선언의 중복 ID는 타입 의존성을 정확히 구분할 수 없습니다.');
          const target = records.get(reference);
          if (target?.kind === 'type' && !ordinaryTypes.has(identityOf(target))) {
            ordinaryTypes.add(identityOf(target)); includeTypes(target);
          }
        }
      }
      for (const record of view.records) if (!record.path && recordCapabilities(record, id).some((capability) => grants.has(capability))) includeTypes(record);
    }
    for (const view of declarationViews) {
      for (const record of view.records) {
        if (record.imports.some((entry) => !selectedImports.has(entry)))
          throw new DistributionError('declaration-entry-unreviewed', '공개 import 경로가 검증된 selectedEntries에 없습니다.');
        const capabilities = recordCapabilities(record, id);
        // owner/path는 제한 분류에만 사용하며 권한은 실제 public import의 정확한 capability로 확인합니다.
        const restricted = capabilities.some((capability) => explicit.has(capability)) ||
          Boolean(record.path && [...explicit].some((capability) => capability.startsWith(`${id}:`) && capability.endsWith(`:${record.owner}.${record.path}`)));
        if (restricted && (capabilities.length === 0 || capabilities.some((capability) => !grants.has(capability))))
          throw new DistributionError('projected-api-excluded', '명시적인 개별 capability가 없는 API·제한 member가 남아 있습니다.');
        if (!record.path && !ordinaryTypes.has(identityOf(record)) && !capabilities.some((capability) => grants.has(capability)))
          throw new DistributionError('projected-api-unreviewed', '공개 선언의 capability 또는 일반 타입 의존성 분류가 필요합니다.');
      }
    }
    declarations[id] = parsed;
  }
  if (manifest.features.some((grant) => !verifiedGrants.has(grant)))
    throw new DistributionError('runtime-capabilities-mismatch', '제공 manifest의 capability가 패키지 metadata에 없습니다.');
  return declarations;
}
