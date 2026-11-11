import { createHash } from 'node:crypto';
import { z } from 'zod';
import { digestSchema, distributionBuildIdSchema, distributionCapabilitySchema, distributionIdSchema, distributionVersionSchema } from '../../src/distribution/schema.ts';
import { relativeDistributionPathSchema } from '../../src/distribution/content.ts';

export class DistributionError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.code = code; this.name = 'DistributionError'; }
}

/** Framework 계약: object key는 localeCompare로 정렬하며 array 순서는 보존합니다. */
export function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const json = JSON.stringify(value);
    if (json === undefined) throw new DistributionError('invalid-json', 'JSON 값이 필요합니다.');
    return json;
  }
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(',')}}`;
}
export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}
export function objectDigest(value: unknown): string { return sha256(stableJson(value)); }

export const providedPackageSchema = z.strictObject({
  packageName: z.string().regex(/^@owp\/[a-z][a-z0-9-]*$/),
  version: distributionVersionSchema, baseVersion: distributionVersionSchema,
  relativePath: relativeDistributionPathSchema, artifactDigest: digestSchema,
}).readonly();
export const providedManifestSchema = z.strictObject({
  schemaVersion: z.literal(1), audience: z.literal('company'),
  companyId: distributionIdSchema, buildId: distributionBuildIdSchema,
  createdAt: z.iso.datetime(), policyHash: digestSchema, compatibilityHash: digestSchema,
  sourceDigest: digestSchema, contractDigest: digestSchema,
  features: z.array(distributionCapabilitySchema).readonly(),
  packages: z.record(distributionIdSchema, providedPackageSchema).readonly(),
  manifestDigest: digestSchema,
}).readonly();
export type ProvidedManifest = z.infer<typeof providedManifestSchema>;

export function parseProvidedManifest(value: unknown, companyId: string): ProvidedManifest {
  const manifest = providedManifestSchema.parse(value);
  const { manifestDigest, ...payload } = manifest;
  if (objectDigest(payload) !== manifestDigest)
    throw new DistributionError('manifest-digest-mismatch', '제공 manifest의 digest가 일치하지 않습니다.');
  if (manifest.companyId !== companyId)
    throw new DistributionError('company-mismatch', '프로필과 manifest의 고객이 일치하지 않습니다.');
  for (const [id, entry] of Object.entries(manifest.packages))
    if (entry.packageName !== `@owp/${id}`)
      throw new DistributionError('package-identity-mismatch', '패키지 ID와 이름이 일치하지 않습니다.');
  return manifest;
}
