import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'vite';
import type { Plugin } from 'vite';
import { companyFileUrl, readCompanyBundle } from '../../mcp/company/bundle.ts';
import type { BundlePin } from '../../mcp/company/model.ts';
import { createCompanyKnowledgeStore } from '../../mcp/company/store.ts';
import { fileIdentity, inventoryPackage } from '../distribution/files.ts';
import { DistributionError, objectDigest, sha256, stableJson } from '../distribution/integrity.ts';
import { verifyCompanyRuntime } from '../distribution/runtime.ts';
import { readProjectedDeclarations } from '../distribution/material.ts';
import { assertFreshOutput } from './prepare.ts';
import type { RuntimeInput } from './prepare.ts';
import {
  assertRuntimeCss,
  assertStaticRuntime,
  checkExecutionTypes,
  companyPackageResolver,
  executionTypeEntry,
  inside,
  snapshotCompanyRuntime,
  toolingRoot,
} from './execution.ts';
import type { CompanyRuntimeSnapshot } from './execution.ts';
import { companyViewerEntry, companyViewerHtml } from './viewer.ts';
import { publicPackageBoundary } from './public-packages.ts';
import { cssTargets, relativeMaterialTarget } from '../distribution/graph.ts';

/** 원래 Vite config·public·전체 entry를 읽지 않는 고객 전용 build입니다. */
export async function buildCompanyPlayground(input: {
  readonly bundleRoot: string;
  readonly pin: BundlePin;
  readonly output: string;
  readonly protectedRoots: readonly string[];
  readonly runtime?: RuntimeInput;
}) {
  const bundle = readCompanyBundle(input.bundleRoot, input.pin);
  const executable = bundle.spec.executionAdapters.length > 0;
  let packageRoots: Readonly<Record<string, string>> = {};
  let runtime: CompanyRuntimeSnapshot = snapshotCompanyRuntime(bundle, packageRoots);
  if (executable) {
    if (!input.runtime)
      throw new DistributionError(
        'company-runtime-pending',
        '실행 build에는 검증 가능한 실제 고객 runtime이 필요합니다.',
      );
    const verification = verifyCompanyRuntime(
      input.runtime.runtimeConfigRoot,
      bundle.manifest,
      input.runtime.runtime,
      input.runtime.verifyPackageDigest,
    );
    if (verification.status !== 'verified')
      throw new DistributionError(
        'company-runtime-pending',
        '고객 runtime 식별자와 artifact 검증에 실패했습니다.',
      );
    packageRoots = verification.packageRoots;
    runtime = snapshotCompanyRuntime(bundle, packageRoots);
    const declarations = await readProjectedDeclarations(bundle.manifest, packageRoots);
    for (const [id, parsed] of Object.entries(declarations))
      if (
        objectDigest(parsed) !==
        objectDigest(JSON.parse(bundle.read(`api/${id}.json`).toString('utf8')))
      )
        throw new DistributionError(
          'company-declaration-mismatch',
          '실행 package의 projected 선언이 번들과 다릅니다.',
        );
  }
  const output = resolve(input.output);
  assertFreshOutput(input.bundleRoot, output, [
    ...input.protectedRoots,
    ...Object.values(packageRoots),
    ...(input.runtime
      ? [resolve(input.runtime.runtimeConfigRoot, input.runtime.runtime.root)]
      : []),
  ]);
  const staging = `${output}.preparing`;
  const source = resolve(staging, 'source');
  const destination = resolve(staging, 'viewer');
  mkdirSync(source, { recursive: true });
  try {
    const put = (root: string, file: string, bytes: string | Uint8Array) => {
      const path = resolve(root, file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, bytes, { flag: 'wx' });
    };
    for (const file of bundle.descriptor.files)
      if (file.path !== 'material.json') put(source, file.path, bundle.read(file.path));
    const generatedSources = new Map([
      [resolve(source, 'index.html'), companyViewerHtml(bundle, executable)],
      [resolve(source, 'entry.js'), companyViewerEntry(bundle, executable)],
    ]);
    for (const [file, content] of generatedSources) put(source, relative(source, file), content);
    if (executable) {
      put(source, 'execution-check.ts', executionTypeEntry(bundle));
      checkExecutionTypes(
        bundle,
        source,
        packageRoots,
        resolve(source, 'execution-check.ts'),
        runtime,
      );
    }
    const resolver = companyPackageResolver(bundle, packageRoots, runtime);
    const materialRoot = resolve(source, 'materials');
    const inventory = new Set<string>();
    const moduleMap = new Map(
      bundle.spec.modules.map((module) => [resolve(materialRoot, module.path), module]),
    );
    const packageEntries = Object.entries(resolver.roots);
    const readRuntimeFile = (file: string) => {
      const bytes = runtime.read(file);
      if (!bytes)
        throw new DistributionError(
          'company-runtime-missing',
          '고정된 runtime snapshot에 파일이 없습니다.',
        );
      return bytes;
    };
    const installedNodeModules = realpathSync(resolve('node_modules'));
    const toolingEntries = new Map([
      ['react', resolve(installedNodeModules, 'react/index.js')],
      ['react/jsx-runtime', resolve(installedNodeModules, 'react/jsx-runtime.js')],
      ['react/jsx-dev-runtime', resolve(installedNodeModules, 'react/jsx-dev-runtime.js')],
      ['react-dom/client', resolve(installedNodeModules, 'react-dom/client.js')],
    ]);
    const requireTool = createRequire(import.meta.url);
    const publicPackages = publicPackageBoundary(bundle.spec.externalPackages);
    const describeModule = (raw: string): string => {
      const file = raw.split('?')[0] ?? raw;
      if (file.startsWith('\0') || file.startsWith('vite/')) return 'bundler-runtime';
      const pkg = packageEntries.find(([, root]) => inside(root, file));
      if (pkg) {
        runtime.requireFile(pkg[1], file);
        return 'company-runtime';
      }
      if (file === resolve(source, 'entry.js') || file === resolve(source, 'index.html'))
        return 'viewer-entry';
      if (moduleMap.has(file)) return 'reviewed-material';
      const tooling = toolingRoot(file);
      if (tooling && existsSync(file)) {
        publicPackages.assertFile(file);
        return 'public-tooling';
      }
      throw new DistributionError(
        'company-build-module',
        '검토되지 않은 app·source·module이 build에 포함되었습니다.',
      );
    };
    const guard: Plugin = {
      name: 'owp-company-only',
      enforce: 'pre',
      resolveId(specifier, importer) {
        if (specifier.startsWith('@owp/')) {
          return resolver.resolve(specifier, 'runtime');
        }
        if (!importer) return null;
        const base = importer.split('?')[0] ?? importer;
        const module = moduleMap.get(base);
        if (module) {
          const dependency = module.dependencies[specifier];
          if (!dependency)
            throw new DistributionError(
              'company-import-unreviewed',
              '실제 import가 검토된 dependency map에 없습니다.',
            );
          if (dependency.kind === 'file') return resolve(materialRoot, dependency.path);
        }
        const runtimePackage = packageEntries.find(([, root]) => inside(root, base));
        if (runtimePackage && specifier.startsWith('.')) {
          const target = resolve(dirname(base), specifier);
          if (
            specifier.includes('?') ||
            specifier.includes('#') ||
            !inside(runtimePackage[1], target)
          )
            throw new DistributionError(
              'company-runtime-escape',
              'runtime 상대 import가 검증된 package root를 벗어납니다.',
            );
          const file = [target, `${target}.js`, `${target}.mjs`, `${target}/index.js`].find(
            (file) => runtime.has(file),
          );
          if (!file)
            throw new DistributionError(
              'company-runtime-missing',
              'runtime의 정적 import 파일이 없습니다.',
            );
          return runtime.requireFile(runtimePackage[1], file);
        }
        if (runtimePackage && !toolingEntries.has(specifier)) {
          const packageName = specifier
            .split('/')
            .slice(0, specifier.startsWith('@') ? 2 : 1)
            .join('/');
          if (
            specifier.startsWith('/') ||
            specifier.includes(':') ||
            !bundle.spec.externalPackages.includes(packageName)
          )
            throw new DistributionError(
              'company-runtime-import',
              'runtime의 외부 import를 명시적으로 검토해야 합니다.',
            );
        }
        if (specifier.includes('@owp/'))
          throw new DistributionError(
            'company-package-alias',
            '우회 OWP import 경로를 사용할 수 없습니다.',
          );
        const tooling = toolingEntries.get(specifier);
        if (tooling) return realpathSync(tooling);
        const externalName = specifier
          .split('/')
          .slice(0, specifier.startsWith('@') ? 2 : 1)
          .join('/');
        if (bundle.spec.externalPackages.includes(externalName))
          return requireTool.resolve(specifier);
        return null;
      },
      load(id) {
        const generated = generatedSources.get(id);
        if (generated !== undefined) return generated;
        const file = id.split('?')[0] ?? id;
        describeModule(id);
        const material = moduleMap.get(file);
        if (material) {
          const bytes = bundle.read(`materials/${material.path}`);
          if (/\.(?:[cm]?[jt]sx?|json|css)$/.test(file)) return bytes.toString('utf8');
        }
        if (packageEntries.some(([, root]) => inside(root, file))) {
          const pkg = packageEntries.find(([, root]) => inside(root, file));
          if (!pkg)
            throw new DistributionError('company-runtime-missing', 'package root가 없습니다.');
          runtime.requireFile(pkg[1], file);
          const bytes = readRuntimeFile(file);
          assertStaticRuntime(file, bytes.toString('utf8'));
          assertRuntimeCss({
            root: pkg[1],
            file,
            source: bytes.toString('utf8'),
            includes: (target) => runtime.has(target),
          });
          if (/\.(?:[cm]?[jt]sx?|json|css)$/.test(file)) return bytes.toString('utf8');
          const reference = this.emitFile({
            type: 'asset',
            name: basename(file),
            originalFileName: file,
            source: bytes,
          });
          return `export default import.meta.ROLLUP_FILE_URL_${reference};`;
        }
        return null;
      },
      generateBundle(_options, emitted) {
        for (const chunk of Object.values(emitted))
          if (chunk.type === 'chunk') {
            if (
              [...chunk.imports, ...chunk.dynamicImports].some(
                (file) => !Object.hasOwn(emitted, file),
              )
            )
              throw new DistributionError(
                'company-unresolved-output',
                '해결되지 않은 외부 module이 산출물에 남아 있습니다.',
              );
            for (const id of Object.keys(chunk.modules)) inventory.add(describeModule(id));
          }
        for (const asset of Object.values(emitted))
          if (asset.type === 'asset' && asset.fileName.endsWith('.css')) {
            const css = (
              typeof asset.source === 'string'
                ? asset.source
                : Buffer.from(asset.source).toString('utf8')
            ).replaceAll('/*$vite$:1*/', '');
            for (const target of cssTargets(css)) {
              const included = relativeMaterialTarget(asset.fileName, target);
              if (!included || !Object.hasOwn(emitted, included))
                throw new DistributionError(
                  'company-css-output',
                  '출력 CSS는 같은 build의 포함 asset만 참조할 수 있습니다.',
                );
            }
          }
        for (const asset of Object.values(emitted))
          if (
            asset.type === 'asset' &&
            !asset.fileName.endsWith('.css') &&
            asset.fileName !== 'index.html'
          ) {
            if (!asset.originalFileNames.length)
              throw new DistributionError(
                'company-asset-origin',
                '출력 asset의 포함 원본을 확인할 수 없습니다.',
              );
            for (const original of asset.originalFileNames) {
              const file = resolve(source, original);
              describeModule(file);
              const material = moduleMap.get(file);
              const expected =
                runtime.read(file) ??
                (material ? bundle.read(`materials/${material.path}`) : readFileSync(file));
              if (sha256(asset.source) !== sha256(expected))
                throw new DistributionError(
                  'company-asset-changed',
                  '출력 asset이 검증된 포함 bytes와 다릅니다.',
                );
            }
          }
      },
    };
    await build({
      configFile: false,
      root: source,
      publicDir: false,
      base: './',
      plugins: [guard],
      resolve: { preserveSymlinks: false },
      build: {
        outDir: destination,
        emptyOutDir: false,
        sourcemap: false,
        assetsInlineLimit: 0,
        minify: 'oxc',
        rollupOptions: {
          input: resolve(source, 'index.html'),
          onwarn(warning, defaultHandler) {
            if (warning.code === 'UNRESOLVED_IMPORT')
              throw new DistributionError(
                'company-unresolved-import',
                '모든 module import를 실제 포함 파일로 resolve해야 합니다.',
              );
            defaultHandler(warning);
          },
        },
      },
      logLevel: 'warn',
    });
    if (!inventory.size)
      throw new DistributionError(
        'company-build-inventory',
        '실제 build module inventory가 비어 있습니다.',
      );
    for (const file of bundle.descriptor.files)
      if (file.path === 'provided-manifest.json' || file.path.startsWith('materials/'))
        put(destination, file.path, bundle.read(file.path));
    const store = createCompanyKnowledgeStore({ bundleRoot: input.bundleRoot, pin: input.pin });
    for (const id of Object.keys(bundle.manifest.packages)) {
      const records = [];
      for (const item of bundle.spec.items.filter((item) => item.packageId === id && item.recordId))
        records.push((await store.getApi({ package: id, symbol: item.recordId })).record);
      put(
        destination,
        `api/${id}.json`,
        stableJson({
          schemaVersion: 1,
          releaseId: bundle.pin.releaseId,
          package: id,
          packageVersion: bundle.manifest.packages[id]?.version,
          records,
        }),
      );
    }
    const index = bundle.spec.items.map((item) => ({
      id: item.recordId ?? item.id,
      kind: item.kind,
      title: item.title,
      description: item.description,
      packageId: item.packageId,
      files: item.files.map((file) => companyFileUrl(`materials/${file}`)),
    }));
    put(
      destination,
      'search-index.json',
      stableJson({ schemaVersion: 1, releaseId: bundle.pin.releaseId, items: index }),
    );
    put(destination, 'module-inventory.json', stableJson({ modules: [...inventory].sort() }));
    const files = inventoryPackage(destination);
    const payload = {
      schemaVersion: 1,
      kind: 'company-playground-build',
      companyId: bundle.pin.companyId,
      buildId: bundle.pin.buildId,
      manifestDigest: bundle.pin.manifestDigest,
      releaseId: bundle.pin.releaseId,
      bundleDigest: bundle.pin.bundleDigest,
      executionReady: executable,
      browserVerified: false,
      deliveryStatus: 'pending',
      installStatus: 'pending',
      files,
      modules: [...inventory].sort(),
    } as const;
    put(
      destination,
      'playground-build.json',
      stableJson({ ...payload, buildDigest: objectDigest(payload) }),
    );
    const identity = fileIdentity(destination, 'playground-build.json');
    mkdirSync(output, { recursive: false });
    try {
      renameSync(destination, output);
    } catch (error) {
      rmSync(output, { recursive: true, force: true });
      throw error;
    }
    rmSync(staging, { recursive: true, force: true });
    return { ...payload, buildDigest: objectDigest(payload), descriptorHash: identity.sha256 };
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}
