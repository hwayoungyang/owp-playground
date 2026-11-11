import { z } from 'zod';
import {
  relativeDistributionPathSchema,
  contentItemSchema,
} from '../../src/distribution/content.ts';
import {
  digestSchema,
  distributionBuildIdSchema,
  distributionIdSchema,
} from '../../src/distribution/schema.ts';
import { reviewedModuleSchema } from '../../scripts/distribution/graph.ts';

export const fileIdentitySchema = z
  .strictObject({
    path: relativeDistributionPathSchema,
    bytes: z.number().int().nonnegative(),
    sha256: digestSchema,
  })
  .readonly();
export const bundleIdentitySchema = z
  .strictObject({
    companyId: distributionIdSchema,
    buildId: distributionBuildIdSchema,
    manifestDigest: digestSchema,
    releaseId: distributionBuildIdSchema,
  })
  .readonly();
export const bundlePinSchema = bundleIdentitySchema
  .unwrap()
  .extend({ bundleDigest: digestSchema })
  .readonly();
export type BundlePin = z.infer<typeof bundlePinSchema>;

export const viewerModuleOriginSchema = z.enum([
  'viewer-entry',
  'reviewed-material',
  'company-runtime',
  'public-tooling',
  'bundler-runtime',
]);
export const viewerBuildSchema = bundlePinSchema
  .unwrap()
  .extend({
    schemaVersion: z.literal(1),
    kind: z.literal('company-playground-build'),
    executionReady: z.boolean(),
    browserVerified: z.literal(false),
    deliveryStatus: z.literal('pending'),
    installStatus: z.literal('pending'),
    files: z.array(fileIdentitySchema).readonly(),
    modules: z.array(viewerModuleOriginSchema).min(1).readonly(),
    buildDigest: digestSchema,
  })
  .readonly();

export const companyItemSchema = contentItemSchema
  .unwrap()
  .extend({
    id: z.string().regex(/^[a-zA-Z0-9][\w.-]{0,127}$/),
    kind: z.enum(['api', 'type', 'guide', 'example', 'source']),
    classification: z.literal('reviewed'),
    title: z.string().min(1),
    description: z.string(),
    references: z.array(z.string().min(1)).readonly(),
    recordId: z.string().min(1).optional(),
    entrypoint: relativeDistributionPathSchema.optional(),
  })
  .readonly();
export type CompanyItem = z.infer<typeof companyItemSchema>;

export const executionAdapterSchema = z
  .strictObject({
    itemId: z.string().min(1),
    entry: relativeDistributionPathSchema,
    exportName: z.string().regex(/^[A-Za-z_$][\w$]*$/),
    kind: z.literal('react-component'),
    props: z.record(z.string(), z.json()),
  })
  .readonly();
export type ExecutionAdapter = z.infer<typeof executionAdapterSchema>;

export const bundleSpecSchema = bundleIdentitySchema
  .unwrap()
  .extend({
    schemaVersion: z.literal(1),
    kind: z.literal('company-bundle-spec'),
    materialDigest: digestSchema,
    items: z.array(companyItemSchema).min(1).readonly(),
    requestedItems: z.array(z.string().min(1)).min(1).readonly(),
    knownCapabilities: z.array(z.string().min(1)).readonly(),
    modules: z.array(reviewedModuleSchema).readonly(),
    externalPackages: z.array(z.string().min(1)).readonly(),
    executionAdapters: z.array(executionAdapterSchema).readonly(),
  })
  .readonly();
export type BundleSpec = z.infer<typeof bundleSpecSchema>;

export const materialDescriptorSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    kind: z.literal('company-prepared-material'),
    companyId: distributionIdSchema,
    buildId: distributionBuildIdSchema,
    manifestDigest: digestSchema,
    executionReady: z.literal(false),
    files: z.array(fileIdentitySchema).readonly(),
    materialDigest: digestSchema,
  })
  .readonly();

export const bundleDescriptorSchema = bundleIdentitySchema
  .unwrap()
  .extend({
    schemaVersion: z.literal(1),
    kind: z.literal('company-local-playground'),
    executionReady: z.literal(false),
    materialDigest: digestSchema,
    spec: bundleSpecSchema,
    files: z.array(fileIdentitySchema).readonly(),
    bundleDigest: digestSchema,
  })
  .readonly();
export type BundleDescriptor = z.infer<typeof bundleDescriptorSchema>;

// 전체 registry에 의존하지 않는 실제 projected declaration reader의 계약입니다.
export const projectedRecordSchema = z
  .strictObject({
    id: z.string(),
    package: z.string(),
    packageVersion: z.string(),
    owner: z.string(),
    name: z.string(),
    path: z.string(),
    kind: z.enum(['component', 'function', 'constant', 'type', 'method', 'event', 'property']),
    imports: z.array(z.string()),
    description: z.string(),
    signature: z.string(),
    typeParameters: z.array(
      z.strictObject({
        name: z.string(),
        constraint: z.string().nullable(),
        default: z.string().nullable(),
      }),
    ),
    typeReferences: z.record(z.string(), z.string()),
    optional: z.boolean(),
    bases: z.array(
      z.strictObject({
        id: z.string(),
        omit: z.array(z.string()),
        pick: z.array(z.string()),
        partial: z.boolean(),
        required: z.boolean(),
        conditional: z.boolean(),
        arguments: z.array(z.string()),
      }),
    ),
    related: z.array(z.string()),
    requirement: z.enum(['required', 'optional', 'conditional']).optional(),
    source: z.strictObject({
      path: z.string(),
      line: z.number().int().positive(),
      sha256: digestSchema,
    }),
  })
  .readonly();
export type ProjectedRecord = z.infer<typeof projectedRecordSchema>;
export const projectedDeclarationsSchema = z
  .strictObject({
    version: z.string(),
    records: z.array(projectedRecordSchema).readonly(),
    reexports: z.array(z.unknown()).length(0),
    augmentations: z.array(z.unknown()).length(0),
    declarationHash: digestSchema,
    runtimeHash: digestSchema,
  })
  .readonly();
