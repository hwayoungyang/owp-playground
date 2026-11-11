import { mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import type { Plugin } from 'vite';
import { z } from 'zod';
import { assertInventory, readCompanyBundle } from '../../mcp/company/bundle.ts';
import { bundlePinSchema, viewerBuildSchema } from '../../mcp/company/model.ts';
import type { BundlePin } from '../../mcp/company/model.ts';
import { inventoryPackage, overlaps, readSafeFile } from '../distribution/files.ts';
import { DistributionError, objectDigest, sha256, stableJson } from '../distribution/integrity.ts';
import { assertFreshOutput } from './prepare.ts';
import { toolingRoot } from './execution.ts';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const companyModules = ['bundle', 'model', 'schema', 'server', 'snapshot', 'store'].map((name) =>
  resolve(projectRoot, `mcp/company/${name}.ts`),
);
const validationModules = [
  'scripts/distribution/integrity.ts',
  'scripts/distribution/files.ts',
  'scripts/distribution/graph.ts',
  'src/distribution/schema.ts',
  'src/distribution/history-schema.ts',
  'src/distribution/content.ts',
].map((file) => resolve(projectRoot, file));
const publicPackages = new Set([
  '@modelcontextprotocol/server',
  '@modelcontextprotocol/core',
  'zod',
  '@typescript/typescript6',
  'typescript',
]);
const publicMetadataSchema = z.object({ name: z.string(), version: z.string() });

/** 명시적으로 고정한 viewer와 Knowledge만 읽고 새 이식 가능 root를 만듭니다. */
export async function assembleCompanyPlayground(input: {
  readonly bundleRoot: string;
  readonly pin: BundlePin;
  readonly viewerRoot: string;
  readonly buildDigest: string;
  readonly output: string;
  readonly protectedRoots: readonly string[];
}) {
  if (overlaps(input.bundleRoot, input.viewerRoot))
    throw new DistributionError(
      'company-assembly-mixed-root',
      'Knowledge와 viewer는 서로 분리된 root여야 합니다.',
    );
  const bundle = readCompanyBundle(input.bundleRoot, input.pin);
  const viewerDescriptor = readSafeFile(input.viewerRoot, 'playground-build.json');
  const viewer = viewerBuildSchema.parse(JSON.parse(viewerDescriptor.toString('utf8')));
  const { buildDigest, ...viewerPayload } = viewer;
  if (
    buildDigest !== input.buildDigest ||
    objectDigest(viewerPayload) !== buildDigest ||
    objectDigest(
      bundlePinSchema.parse({
        companyId: viewer.companyId,
        buildId: viewer.buildId,
        manifestDigest: viewer.manifestDigest,
        releaseId: viewer.releaseId,
        bundleDigest: viewer.bundleDigest,
      }),
    ) !== objectDigest(bundle.pin)
  )
    throw new DistributionError(
      'company-viewer-identity',
      'viewer build와 고정 bundle의 identity·digest가 다릅니다.',
    );
  assertInventory(inventoryPackage(input.viewerRoot), [
    ...viewer.files,
    {
      path: 'playground-build.json',
      bytes: viewerDescriptor.length,
      sha256: sha256(viewerDescriptor),
    },
  ]);
  if (
    !viewer.files.some((file) => file.path === 'index.html') ||
    viewer.files.some(
      (file) =>
        !/^(?:index\.html|provided-manifest\.json|search-index\.json|module-inventory\.json|(?:assets|materials|api)\/.+)$/.test(
          file.path,
        ) || file.path.endsWith('.map'),
    ) ||
    objectDigest(viewer.modules) !== objectDigest([...new Set(viewer.modules)].sort()) ||
    !viewer.modules.includes('viewer-entry') ||
    (viewer.executionReady &&
      (!viewer.modules.includes('company-runtime') ||
        !viewer.modules.includes('reviewed-material'))) ||
    objectDigest(
      JSON.parse(readSafeFile(input.viewerRoot, 'module-inventory.json').toString('utf8')),
    ) !== objectDigest({ modules: viewer.modules })
  )
    throw new DistributionError(
      'company-viewer-provenance',
      '고객 전용 viewer의 파일·module provenance가 맞지 않습니다.',
    );
  for (const file of bundle.descriptor.files.filter(
    (file) => file.path === 'provided-manifest.json' || file.path.startsWith('materials/'),
  ))
    if (sha256(readSafeFile(input.viewerRoot, file.path)) !== file.sha256)
      throw new DistributionError(
        'company-viewer-material',
        'viewer 자료가 고정 Knowledge와 다릅니다.',
      );
  const output = resolve(input.output);
  const protectedRoots = [...input.protectedRoots, input.bundleRoot, input.viewerRoot];
  assertFreshOutput(input.bundleRoot, output, protectedRoots);
  assertFreshOutput(input.viewerRoot, `${output}.preparing`, protectedRoots);
  const staging = `${output}.preparing`;
  mkdirSync(staging);
  const put = (file: string, bytes: string | Uint8Array) => {
    const target = resolve(staging, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes, { flag: 'wx' });
  };
  try {
    for (const file of viewer.files) {
      const bytes = readSafeFile(input.viewerRoot, file.path);
      if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256)
        throw new DistributionError(
          'company-viewer-changed',
          '검증 이후 viewer 파일이 변경되었습니다.',
        );
      put(`playground/${file.path}`, bytes);
    }
    put('playground/playground-build.json', viewerDescriptor);
    for (const file of bundle.descriptor.files)
      put(`knowledge/${file.path}`, bundle.read(file.path));
    put('knowledge/company-bundle.json', bundle.descriptorBytes);
    // 복사한 바이트도 원본과 같은 pin으로 다시 검증합니다.
    readCompanyBundle(resolve(staging, 'knowledge'), bundle.pin);
    const source = resolve(staging, 'runtime-source.mjs');
    const sourceContent = `import {createCompanyKnowledgeServer} from ${JSON.stringify(resolve(projectRoot, 'mcp/company/server.ts'))};\nimport {serveStdio} from ${JSON.stringify(fileURLToPath(import.meta.resolve('@modelcontextprotocol/server/stdio')))};\nexport function startCompanyStdio(bundleRoot,pin){const server=createCompanyKnowledgeServer({bundleRoot,pin});const handle=serveStdio(()=>server,{onerror:error=>process.stderr.write('MCP error: '+error.name+'\\n')});const close=()=>{void handle.close().catch(()=>{process.exitCode=1;});};process.once('SIGINT',close);process.once('SIGTERM',close);process.stdin.once('end',close);}\n`;
    put('runtime-source.mjs', sourceContent);
    const origins = new Map<string, Set<string>>();
    const dependencies = new Map<string, string>();
    const classify = (raw: string): string => {
      const file = raw.split('?')[0] ?? raw;
      if (file.startsWith('\0') || file.startsWith('vite/')) return 'bundler-runtime';
      if (file === source) return 'fixed-stdio-entry';
      if (companyModules.includes(file)) return 'company-server';
      if (validationModules.includes(file)) return 'shared-validation';
      const root = toolingRoot(file);
      if (root) {
        const pkg = publicMetadataSchema.parse(
          JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')),
        );
        if (publicPackages.has(pkg.name) && !pkg.name.startsWith('@owp/')) {
          dependencies.set(pkg.name, pkg.version);
          return 'public-dependency';
        }
      }
      throw new DistributionError(
        'company-mcp-module',
        '고객 서버·공용 검증·명시된 공개 dependency만 번들링할 수 있습니다.',
      );
    };
    const guard: Plugin = {
      name: 'owp-portable-company-stdio',
      enforce: 'pre',
      resolveId(specifier) {
        if (specifier.startsWith('@owp/'))
          throw new DistributionError(
            'company-mcp-private-package',
            'OWP runtime package는 stdio bundle에 포함할 수 없습니다.',
          );
        return null;
      },
      load(id) {
        if (!isBuiltin(id)) classify(id);
        if (id === source) return sourceContent;
        return null;
      },
      generateBundle(_options, emitted) {
        for (const chunk of Object.values(emitted))
          if (chunk.type === 'chunk') {
            if (
              [...chunk.imports, ...chunk.dynamicImports].some(
                (file) => !isBuiltin(file) && !Object.hasOwn(emitted, file),
              )
            )
              throw new DistributionError(
                'company-mcp-external',
                'Node builtin 외의 미번들 dependency가 남아 있습니다.',
              );
            for (const id of Object.keys(chunk.modules)) {
              const origin = classify(id);
              const ids = origins.get(origin) ?? new Set<string>();
              ids.add(id);
              origins.set(origin, ids);
            }
          }
      },
    };
    await build({
      configFile: false,
      root: staging,
      publicDir: false,
      plugins: [guard],
      ssr: { noExternal: true, target: 'node' },
      build: {
        ssr: source,
        outDir: resolve(staging, 'mcp'),
        emptyOutDir: false,
        copyPublicDir: false,
        sourcemap: false,
        minify: 'oxc',
        target: 'node22',
        rollupOptions: {
          external: (id) => isBuiltin(id),
          output: {
            format: 'es',
            entryFileNames: 'runtime.mjs',
            codeSplitting: false,
            banner:
              'import {createRequire as portableRequire} from "node:module";import {fileURLToPath as portablePath} from "node:url";import {dirname as portableDirname} from "node:path";const require=portableRequire(import.meta.url);const __filename=portablePath(import.meta.url);const __dirname=portableDirname(__filename);',
          },
          onwarn(warning, handler) {
            if (warning.code === 'UNRESOLVED_IMPORT')
              throw new DistributionError(
                'company-mcp-unresolved',
                'stdio의 모든 공개 dependency를 로컬에서 resolve해야 합니다.',
              );
            handler(warning);
          },
        },
      },
      logLevel: 'warn',
    });
    rmSync(source);
    if (
      !origins.has('company-server') ||
      !origins.has('shared-validation') ||
      !origins.has('public-dependency')
    )
      throw new DistributionError(
        'company-mcp-inventory',
        '실제 stdio module inventory가 완전하지 않습니다.',
      );
    for (const file of inventoryPackage(resolve(staging, 'mcp')))
      if (
        readSafeFile(resolve(staging, 'mcp'), file.path).includes(
          Buffer.from(realpathSync(projectRoot)),
        )
      )
        throw new DistributionError(
          'company-mcp-provenance',
          'stdio 출력에 비공개 원본 절대 경로가 남아 있습니다.',
        );
    put(
      'mcp/stdio.mjs',
      `import {fileURLToPath} from 'node:url';\nimport {startCompanyStdio} from './runtime.mjs';\nif(process.argv.length!==2)throw new TypeError('This launcher accepts no arguments.');\nconst bundlePin=Object.freeze(${stableJson(bundle.pin)});\nstartCompanyStdio(fileURLToPath(new URL('../knowledge/',import.meta.url)),bundlePin);\n`,
    );
    const moduleInventory = {
      origins: [...origins]
        .map(([origin, ids]) => ({ origin, count: ids.size }))
        .sort((a, b) => a.origin.localeCompare(b.origin)),
      publicDependencies: [...dependencies]
        .map(([name, version]) => ({ name, version }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      externalDependencies: [],
    };
    put('mcp/module-inventory.json', stableJson(moduleInventory));
    put(
      'README.md',
      '# 회사 전용 Playground 조립 결과\n\n`playground/`는 고정 browser build이고 `knowledge/`는 같은 pin으로 검증된 자료입니다.\n\n지원되는 Node에서 다음 명령으로 stdio MCP를 시작합니다. 현재 작업 디렉터리는 자유롭게 정할 수 있습니다.\n\n```sh\nnode /path/to/assembly/mcp/stdio.mjs\n```\n\nNode 실행 파일은 별도로 필요합니다. 공개 MCP SDK·Zod·TypeScript 검증 코드는 runtime.mjs에 번들되어 있어 package 설치·NODE_PATH·원래 저장소가 필요하지 않습니다. launcher는 인자를 받지 않으며 환경 변수로 회사·release·Knowledge root를 선택하지 않습니다.\n\n이 결과는 조립 산출물입니다. 실제 납품·프로젝트 설치·브라우저 검증 기록을 만들지 않습니다. install patch는 설치 대상 프로젝트와 exact package 계약을 확인하는 별도 승인 단계입니다. assembly-manifest.json의 파일 hash와 identity를 확인하고 폴더의 바이트를 보존하세요.\n',
    );
    const payload = {
      schemaVersion: 1,
      kind: 'company-playground-assembly',
      ...bundle.pin,
      buildDigest,
      executionReady: viewer.executionReady,
      browserVerified: false,
      deliveryStatus: 'pending',
      installStatus: 'pending',
      runtime: {
        transport: 'stdio',
        entry: 'mcp/stdio.mjs',
        dependencyStatus: 'bundled',
        node: '^22.23.4 || ^24.22.1 || >=26.12.1',
      },
      moduleInventory,
      files: inventoryPackage(staging),
    } as const;
    const manifest = { ...payload, assemblyDigest: objectDigest(payload) };
    put('assembly-manifest.json', stableJson(manifest));
    const actual = inventoryPackage(staging);
    assertInventory(actual, [
      ...manifest.files,
      {
        path: 'assembly-manifest.json',
        bytes: Buffer.byteLength(stableJson(manifest)),
        sha256: sha256(stableJson(manifest)),
      },
    ]);
    const privateRoots = [
      realpathSync(projectRoot),
      resolve(input.bundleRoot),
      resolve(input.viewerRoot),
      staging,
    ];
    for (const file of actual)
      if (privateRoots.some((root) => readSafeFile(staging, file.path).includes(Buffer.from(root))))
        throw new DistributionError(
          'company-assembly-provenance',
          '고객 출력에 비공개 원본 절대 경로가 남아 있습니다.',
        );
    mkdirSync(output, { recursive: false });
    try {
      renameSync(staging, output);
    } catch (error) {
      rmSync(output, { recursive: true, force: true });
      throw error;
    }
    return manifest;
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}
