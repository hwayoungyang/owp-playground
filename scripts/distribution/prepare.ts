import { fileURLToPath, pathToFileURL } from 'node:url';
import { isAbsolute, resolve } from 'node:path';
import { z } from 'zod';
import { contentItemSchema, planDistribution, relativeDistributionPathSchema } from '../../src/distribution/content.ts';
import { digestSchema, distributionCapabilitySchema, distributionIdSchema } from '../../src/distribution/schema.ts';
import { readDistributionConfig } from './context.ts';
import { readSafeFile, safeDirectory, safePath } from './files.ts';
import { reviewedModuleSchema } from './graph.ts';
import { DistributionError, parseProvidedManifest, sha256 } from './integrity.ts';
import { prepareDistributionMaterial } from './material.ts';
import type { PackageDigestVerifier } from './runtime.ts';

export const preparationRequestSchema = z.strictObject({
  schemaVersion: z.literal(1), configFile: relativeDistributionPathSchema,
  profileId: distributionIdSchema, sourceRoot: z.union([z.literal('.'), relativeDistributionPathSchema]),
  output: z.union([relativeDistributionPathSchema, z.string().refine((value) => isAbsolute(value) && !value.includes('\0'), '명시적인 절대 출력 경로가 필요합니다.')]),
  protectedRoots: z.array(z.union([z.literal('.'), relativeDistributionPathSchema])),
  items: z.array(contentItemSchema), requestedItems: z.array(z.string()).min(1),
  knownCapabilities: z.array(distributionCapabilitySchema), modules: z.array(reviewedModuleSchema),
  externalPackages: z.array(z.string()).default([]),
  digestAdapter: z.strictObject({ path: relativeDistributionPathSchema, sha256: digestSchema }).optional(),
}).readonly();

/** 명시적인 준비 요청만 실행하며 adapter는 기본 바이트 검증에 추가되는 선택 검사입니다. */
export async function runMaterialPreparation(root: string, requestFile: string) {
  const request = preparationRequestSchema.parse(JSON.parse(readSafeFile(root, requestFile).toString('utf8')));
  const { config, configRoot } = readDistributionConfig(root, request.configFile);
  const profile = config.profiles[request.profileId];
  if (!profile || profile.audience !== 'company' || !profile.companyId || !profile.manifest || !profile.runtime)
    throw new DistributionError('company-runtime-required', '고객 manifest와 명시적인 runtime descriptor가 필요합니다.');
  const manifest = parseProvidedManifest(JSON.parse(readSafeFile(configRoot, profile.manifest).toString('utf8')), profile.companyId);
  let verifier: PackageDigestVerifier | undefined;
  if (request.digestAdapter) {
    const adapterPath = safePath(root, request.digestAdapter.path);
    if (!/\.(?:mjs|ts)$/.test(adapterPath) || sha256(readSafeFile(root, request.digestAdapter.path)) !== request.digestAdapter.sha256)
      throw new DistributionError('digest-adapter-mismatch', '검토된 추가 검사 adapter 파일과 hash가 일치해야 합니다.');
    const module = await import(pathToFileURL(adapterPath).href);
    verifier = z.custom<PackageDigestVerifier>((value) => typeof value === 'function').parse(module.verifyPackageDigest);
  }
  const plan = planDistribution({ items: request.items, requestedItems: request.requestedItems,
    knownCapabilities: request.knownCapabilities, packageIds: Object.keys(manifest.packages), grantedCapabilities: manifest.features });
  return prepareDistributionMaterial({
    sourceRoot: safeDirectory(root, request.sourceRoot), runtimeConfigRoot: configRoot,
    output: resolve(root, request.output), protectedRoots: request.protectedRoots.map((path) => safeDirectory(root, path)),
    manifest, runtime: profile.runtime, verifyPackageDigest: verifier, plan, modules: request.modules,
    externalPackages: request.externalPackages,
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!process.argv[2] || process.argv.length !== 3)
      throw new DistributionError('usage', '사용법: node --experimental-strip-types scripts/distribution/prepare.ts <request.json>');
    console.log(JSON.stringify(await runMaterialPreparation(process.cwd(), process.argv[2]), null, 2));
  } catch (error) {
    if (error instanceof Error) {
      console.error(JSON.stringify({ code: error instanceof DistributionError ? error.code : 'preparation-invalid', message: '고객 자료를 준비하지 못했습니다. 요청과 package 계약을 확인하세요.' }));
      process.exitCode = 1;
    } else throw error;
  }
}
