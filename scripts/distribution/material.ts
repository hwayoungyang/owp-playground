import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { DistributionPlan } from '../../src/distribution/content.ts';
import { DistributionError, objectDigest, parseProvidedManifest, sha256, stableJson } from './integrity.ts';
import type { ProvidedManifest } from './integrity.ts';
import { assertNewOutput, safePath } from './files.ts';
import type { FileIdentity } from './files.ts';
import { validateIncludedGraph } from './graph.ts';
import type { ReviewedModule } from './graph.ts';
import { verifyCompanyRuntime } from './runtime.ts';
import type { PackageDigestVerifier, RuntimeDescriptor } from './runtime.ts';
import { readProjectedDeclarations } from './projected-declarations.ts';
export { readProjectedDeclarations } from './projected-declarations.ts';

export type PreparedMaterialDescriptor = {
  readonly schemaVersion: 1;
  readonly kind: 'company-prepared-material';
  readonly companyId: string; readonly buildId: string; readonly manifestDigest: string;
  readonly executionReady: false;
  readonly files: readonly FileIdentity[];
  readonly materialDigest: string;
};

export async function prepareDistributionMaterial(input: {
  readonly sourceRoot: string;
  readonly runtimeConfigRoot: string;
  readonly output: string;
  readonly protectedRoots: readonly string[];
  readonly manifest: ProvidedManifest;
  readonly runtime: RuntimeDescriptor;
  readonly verifyPackageDigest?: PackageDigestVerifier;
  readonly plan: DistributionPlan;
  readonly modules: readonly ReviewedModule[];
  readonly externalPackages?: readonly string[];
}): Promise<PreparedMaterialDescriptor> {
  const manifest = parseProvidedManifest(input.manifest, input.manifest.companyId);
  if (!input.plan.ready) throw new DistributionError('plan-blocked', '해결되지 않은 자료 계획은 준비할 수 없습니다.');
  const verification = verifyCompanyRuntime(input.runtimeConfigRoot, manifest, input.runtime, input.verifyPackageDigest);
  if (verification.status !== 'verified') throw new DistributionError('runtime-not-verified', '실제 고객 package 검증이 필요합니다.');
  const protectedRoots = [...input.protectedRoots, safePath(input.runtimeConfigRoot, input.runtime.root), ...Object.values(verification.packageRoots)];
  assertNewOutput(input.sourceRoot, input.output, protectedRoots);
  const contents = validateIncludedGraph({
    root: input.sourceRoot, includedFiles: input.plan.includedFiles, modules: input.modules,
    packageNames: Object.values(manifest.packages).map((pkg) => pkg.packageName),
    externalPackages: input.externalPackages ?? [], grantedCapabilities: manifest.features,
  });
  const declarations = await readProjectedDeclarations(manifest, verification.packageRoots);
  const output = resolve(input.output);
  const staging = `${output}.preparing`;
  // 기존 파일을 덮어쓰지 않고 완료된 staging 디렉터리만 최종 경로로 옮깁니다.
  mkdirSync(staging, { recursive: false });
  try {
    const files: FileIdentity[] = [];
    const write = (file: string, bytes: Uint8Array) => {
      const target = resolve(staging, file);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes, { flag: 'wx' });
      files.push({ path: file, bytes: bytes.length, sha256: sha256(bytes) });
    };
    write('provided-manifest.json', Buffer.from(stableJson(manifest)));
    for (const [file, bytes] of contents) write(`materials/${file}`, bytes);
    for (const [id, records] of Object.entries(declarations))
      write(`api/${id}.json`, Buffer.from(stableJson(records)));
    const sorted = files.sort((a, b) => a.path.localeCompare(b.path));
    const payload = {
      schemaVersion: 1, kind: 'company-prepared-material', companyId: manifest.companyId,
      buildId: manifest.buildId, manifestDigest: manifest.manifestDigest, executionReady: false,
      files: sorted,
    } as const;
    const descriptor: PreparedMaterialDescriptor = { ...payload, materialDigest: objectDigest(payload) };
    writeFileSync(resolve(staging, 'material.json'), stableJson(descriptor), { flag: 'wx' });
    // exclusive mkdir로 기존 파일·디렉터리를 덮어쓰지 않을 권리를 확보합니다.
    mkdirSync(output, { recursive: false });
    try { renameSync(staging, output); }
    catch (error) { rmSync(output, { recursive: true, force: true }); throw error; }
    return descriptor;
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}
