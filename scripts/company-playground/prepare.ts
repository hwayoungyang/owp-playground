import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { assertNewOutput, fileIdentity } from '../distribution/files.ts';
import { DistributionError, objectDigest, stableJson } from '../distribution/integrity.ts';
import { readProjectedDeclarations } from '../distribution/material.ts';
import { verifyCompanyRuntime } from '../distribution/runtime.ts';
import type { PackageDigestVerifier, RuntimeDescriptor } from '../distribution/runtime.ts';
import { readPreparedMaterial, validateCompanySpec } from '../../mcp/company/bundle.ts';
import { bundleSpecSchema } from '../../mcp/company/model.ts';
import type { BundleDescriptor } from '../../mcp/company/model.ts';

export type RuntimeInput = {
  readonly runtimeConfigRoot: string;
  readonly runtime: RuntimeDescriptor;
  readonly verifyPackageDigest?: PackageDigestVerifier;
};
export function planCompanyPlayground(materialRoot: string, rawSpec: unknown) {
  const { material, snapshot } = readPreparedMaterial(materialRoot);
  const result = validateCompanySpec(snapshot, rawSpec, material.materialDigest);
  return {
    schemaVersion: 1 as const,
    companyId: result.spec.companyId,
    buildId: result.spec.buildId,
    manifestDigest: result.spec.manifestDigest,
    releaseId: result.spec.releaseId,
    materialDigest: material.materialDigest,
    includedItems: result.spec.items.map((item) => item.id),
    includedFiles: material.files.map((file) => file.path),
    executionReady: false as const,
    executionAdapterCount: result.spec.executionAdapters.length,
    runtimeStatus: 'not-checked' as const,
    blockers: ['verified-company-runtime-required'],
  };
}

export async function verifyMaterialRuntime(
  materialRoot: string,
  rawSpec: unknown,
  input: RuntimeInput,
) {
  const { material, manifest, snapshot } = readPreparedMaterial(materialRoot);
  const spec = bundleSpecSchema.parse(rawSpec);
  validateCompanySpec(snapshot, spec, material.materialDigest);
  const verification = verifyCompanyRuntime(
    input.runtimeConfigRoot,
    manifest,
    input.runtime,
    input.verifyPackageDigest,
  );
  if (verification.status !== 'verified')
    throw new DistributionError(
      'company-runtime-pending',
      '실제 고객 package의 식별자와 artifact 검증이 필요합니다.',
    );
  const declarations = await readProjectedDeclarations(manifest, verification.packageRoots);
  for (const [id, parsed] of Object.entries(declarations))
    if (
      objectDigest(parsed) !==
      objectDigest(JSON.parse(snapshot.read(`api/${id}.json`).toString('utf8')))
    )
      throw new DistributionError(
        'company-declaration-mismatch',
        '준비 자료가 실제 고객 projected declaration과 다릅니다.',
      );
  return { material, manifest, spec, packageRoots: verification.packageRoots, snapshot };
}

export function assertFreshOutput(
  sourceRoot: string,
  output: string,
  protectedRoots: readonly string[],
): void {
  assertNewOutput(sourceRoot, output, protectedRoots);
  if (existsSync(output) || existsSync(`${output}.preparing`))
    throw new DistributionError(
      'company-output-exists',
      '출력과 staging 경로는 새 경로여야 합니다.',
    );
}

/** 실제 runtime을 확인한 준비 자료를 새 고객 전용 root에 고정합니다. 배포·설치 기록을 만들지 않습니다. */
export async function prepareCompanyBundle(
  input: RuntimeInput & {
    readonly materialRoot: string;
    readonly spec: unknown;
    readonly output: string;
    readonly protectedRoots: readonly string[];
  },
): Promise<BundleDescriptor> {
  const { material, spec, packageRoots, snapshot } = await verifyMaterialRuntime(
    input.materialRoot,
    input.spec,
    input,
  );
  const output = resolve(input.output);
  assertFreshOutput(input.materialRoot, output, [
    ...input.protectedRoots,
    ...Object.values(packageRoots),
    resolve(input.runtimeConfigRoot, input.runtime.root),
  ]);
  const staging = `${output}.preparing`;
  mkdirSync(staging);
  try {
    for (const file of ['material.json', ...material.files.map((entry) => entry.path)]) {
      const target = resolve(staging, file);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, snapshot.read(file), { flag: 'wx' });
    }
    const payload = {
      schemaVersion: 1,
      kind: 'company-local-playground',
      companyId: spec.companyId,
      buildId: spec.buildId,
      manifestDigest: spec.manifestDigest,
      releaseId: spec.releaseId,
      executionReady: false,
      materialDigest: material.materialDigest,
      spec,
      files: [...material.files, fileIdentity(staging, 'material.json')].sort((a, b) =>
        a.path.localeCompare(b.path),
      ),
    } as const;
    const descriptor: BundleDescriptor = { ...payload, bundleDigest: objectDigest(payload) };
    writeFileSync(resolve(staging, 'company-bundle.json'), stableJson(descriptor), { flag: 'wx' });
    mkdirSync(output, { recursive: false });
    try {
      renameSync(staging, output);
    } catch (error) {
      rmSync(output, { recursive: true, force: true });
      throw error;
    }
    return descriptor;
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}
