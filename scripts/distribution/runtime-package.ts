import { z } from 'zod';
import { digestSchema, distributionCapabilitySchema, distributionIdSchema } from '../../src/distribution/schema.ts';
import { DistributionError } from './integrity.ts';
import type { ProvidedManifest } from './integrity.ts';
import { inventoryPackage, packageArtifactDigest, readSafeFile } from './files.ts';
import type { FileIdentity } from './files.ts';
import { relativeDistributionPathSchema } from '../../src/distribution/content.ts';

const dependencyMapSchema = z.record(z.string(), z.string()).readonly();
const dependencyFields = ['dependencies', 'optionalDependencies', 'peerDependencies'] as const;
const selectedEntrySchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('symbol-entry'),
    runtimeSymbols: z.array(z.string()).readonly(),
    typeSymbols: z.array(z.string()).readonly(),
  }),
  z.strictObject({
    kind: z.literal('asset-entry'),
    runtimeSymbols: z.array(z.string()).length(0).readonly().optional(),
    typeSymbols: z.array(z.string()).length(0).readonly().optional(),
  }),
]).readonly();
export const projectedPackageMetadataSchema = z.object({
  name: z.string(), version: z.string(), scripts: z.never().optional(),
  dependencies: dependencyMapSchema.optional(), optionalDependencies: dependencyMapSchema.optional(), peerDependencies: dependencyMapSchema.optional(),
  owpDistribution: z.object({
    schemaVersion: z.literal(1), companyId: distributionIdSchema, buildId: z.string(),
    packageId: distributionIdSchema, baseVersion: z.string(), companyVersion: z.string(),
    policyHash: digestSchema, projectionHash: digestSchema, sourceDigest: digestSchema, contractDigest: digestSchema,
    enabledOptionalFeatures: z.array(distributionCapabilitySchema).readonly(),
    grantedCapabilities: z.array(distributionCapabilitySchema).readonly(),
    selectedEntries: z.record(z.string(), selectedEntrySchema).readonly(),
    owpDependencies: z.object({ dependencies: dependencyMapSchema.optional(), optionalDependencies: dependencyMapSchema.optional(), peerDependencies: dependencyMapSchema.optional() }),
  }).readonly(),
}).readonly();

/** 검증된 export 객체의 subpath를 package 공개 import 경로로 정리합니다. */
export function projectedImportPaths(metadata: z.infer<typeof projectedPackageMetadataSchema>): readonly string[] {
  return Object.keys(metadata.owpDistribution.selectedEntries).map((entry) => {
    if (entry === '.') return metadata.name;
    if (!entry.startsWith('./'))
      throw new DistributionError('declaration-entry-unreviewed', '공개 export의 subpath가 필요합니다.');
    const subpath = relativeDistributionPathSchema.safeParse(entry.replace(/^\.\//, ''));
    if (!subpath.success)
      throw new DistributionError('declaration-entry-unreviewed', '지원하지 않는 selectedEntries 계약은 별도 검토가 필요합니다.');
    return `${metadata.name}/${subpath.data}`;
  });
}

/** Framework의 package metadata와 정확한 모든 파일 바이트 계약을 함께 확인합니다. */
export function verifyProjectedPackage(packageRoot: string, packageId: string, manifest: ProvidedManifest): {
  readonly metadata: z.infer<typeof projectedPackageMetadataSchema>;
  readonly files: readonly FileIdentity[];
} {
  const expected = manifest.packages[packageId];
  if (!expected) throw new DistributionError('runtime-package-missing', '제공 manifest에 패키지가 없습니다.');
  const metadata = projectedPackageMetadataSchema.parse(JSON.parse(readSafeFile(packageRoot, 'package.json').toString('utf8')));
  const distribution = metadata.owpDistribution;
  if (metadata.name !== expected.packageName || metadata.version !== expected.version ||
    distribution.packageId !== packageId || distribution.companyId !== manifest.companyId ||
    distribution.buildId !== manifest.buildId || distribution.baseVersion !== expected.baseVersion ||
    distribution.companyVersion !== expected.version || distribution.policyHash !== manifest.policyHash ||
    distribution.sourceDigest !== manifest.sourceDigest || distribution.contractDigest !== manifest.contractDigest)
    throw new DistributionError('runtime-metadata-mismatch', '고객 패키지의 버전 또는 배포 metadata가 다릅니다.');
  const grants = distribution.grantedCapabilities;
  const imports = projectedImportPaths(metadata);
  if (new Set(grants).size !== grants.length || grants.some((grant) => !manifest.features.includes(grant)) ||
    distribution.enabledOptionalFeatures.some((grant) => !grants.includes(grant)) ||
    imports.length === 0 || new Set(imports).size !== imports.length)
    throw new DistributionError('runtime-capabilities-mismatch', '패키지 capability와 제공 manifest가 다릅니다.');
  for (const field of dependencyFields) {
    const declared = Object.fromEntries(Object.entries(metadata[field] ?? {}).filter(([name]) => name.startsWith('@owp/')));
    const projected = distribution.owpDependencies[field] ?? {};
    for (const [name, version] of Object.entries({ ...projected, ...declared })) {
      const dependency = Object.values(manifest.packages).find((pkg) => pkg.packageName === name);
      if (!name.startsWith('@owp/') || !dependency || version !== dependency.version ||
        (declared[name] !== undefined && projected[name] !== undefined && declared[name] !== projected[name]))
        throw new DistributionError('runtime-dependency-mismatch', '회사 패키지의 OWP 의존성 폐포와 exact version이 다릅니다.');
    }
  }
  const files = inventoryPackage(packageRoot);
  if (packageArtifactDigest(files) !== expected.artifactDigest)
    throw new DistributionError('runtime-digest-mismatch', '고객 패키지 바이트 digest가 다릅니다.');
  return { metadata, files };
}
