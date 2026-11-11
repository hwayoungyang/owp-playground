import { z } from 'zod';
import { distributionHistorySummarySchema } from './history-schema.ts';

export const distributionIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[-_][a-z0-9]+)*$/);
export const digestSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const distributionBuildIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/);
export const distributionVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?$/);
export const distributionCapabilitySchema = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9_.:/-]*$/)
  .refine((value) => !value.split('/').includes('..'), '개별 capability ID가 필요합니다.');
export const distributionPackageSchema = z
  .strictObject({
    id: distributionIdSchema,
    name: z.string().regex(/^@owp\/[a-z][a-z0-9-]*$/),
    version: distributionVersionSchema,
    baseVersion: distributionVersionSchema.optional(),
  })
  .readonly();
export type DistributionPackage = z.infer<typeof distributionPackageSchema>;

export const distributionIssueSchema = z
  .strictObject({
    code: z.string().regex(/^[a-z][a-z0-9-]*$/),
    message: z.string(),
  })
  .readonly();
export const isolatedPreviewUrlSchema = z
  .string()
  .regex(/^\/company-previews\/[a-z0-9_-]+\/[a-f0-9]{64}\/index\.html$/);
export const distributionTargetSchema = z
  .strictObject({
    label: z.string().min(1),
    audience: z.enum(['full', 'company']),
    runtimeSource: z.enum(['installed', 'company-build', 'local-tarballs']),
    companyId: distributionIdSchema.nullable(),
    buildId: distributionBuildIdSchema.nullable(),
    manifestDigest: digestSchema.nullable(),
    releaseId: distributionBuildIdSchema.nullable(),
    bundleDigest: digestSchema.nullable(),
    buildDigest: digestSchema.nullable(),
    previewDigest: digestSchema.nullable(),
    packages: z.array(distributionPackageSchema).readonly(),
    features: z.array(distributionCapabilitySchema).readonly(),
    manifestStatus: z.enum(['not-required', 'verified', 'missing', 'invalid']),
    runtimeStatus: z.enum(['installed', 'unconfigured', 'verified', 'missing', 'mismatch']),
    issues: z.array(distributionIssueSchema).readonly(),
    previewUrl: isolatedPreviewUrlSchema.nullable(),
  })
  .readonly();
export type DistributionTarget = z.infer<typeof distributionTargetSchema>;
export const distributionProfileSchema = distributionTargetSchema
  .unwrap()
  .extend({
    id: distributionIdSchema,
    builds: z.array(distributionTargetSchema).readonly(),
    history: distributionHistorySummarySchema.optional(),
  })
  .readonly();
export type DistributionProfile = z.infer<typeof distributionProfileSchema>;
export const distributionContextSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    mode: z.enum(['internal', 'company']),
    defaultProfileId: distributionIdSchema,
    profiles: z.array(distributionProfileSchema).readonly(),
  })
  .superRefine((value, ctx) => {
    const ids = value.profiles.map((profile) => profile.id);
    if (new Set(ids).size !== ids.length || !ids.includes(value.defaultProfileId))
      ctx.addIssue({ code: 'custom', message: '프로필 ID와 기본 프로필을 확인하세요.' });
  })
  .readonly();
export type DistributionContext = z.infer<typeof distributionContextSchema>;

declare global {
  const __OWP_DISTRIBUTION__: DistributionContext;
}
