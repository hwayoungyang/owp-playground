import { z } from 'zod';
import { apiRecordSchema } from '../src/features/api/model/schema.ts';
import { exactPackageVersionSchema } from '../src/features/releases/model/schema.ts';

export const packageInput = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^(?:@owp\/)?[a-z][a-z0-9-]*$/);
const pin = {
  package: packageInput,
  version: exactPackageVersionSchema.optional(),
  releaseId: z
    .string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/)
    .optional(),
};
export const pageInput = {
  offset: z.number().int().min(0).max(100000).default(0),
  limit: z.number().int().min(1).max(50).default(20),
};
export const listInput = z.object({ releaseId: pin.releaseId }).strict();
export const searchInput = z
  .object({
    ...pin,
    ...pageInput,
    query: z.string().trim().min(1).max(200),
    kind: z.enum(['api', 'guide', 'example', 'all']).default('all'),
  })
  .strict();
export const apiInput = z
  .object({ ...pin, ...pageInput, symbol: z.string().trim().min(1).max(300) })
  .strict();
export const exampleInput = z
  .object({
    ...pin,
    ...pageInput,
    exampleId: z.string().regex(/^[a-zA-Z0-9][\w.-]{0,127}$/),
    file: z.string().min(1).max(400).optional(),
    includeDependencies: z.boolean().default(false),
    maxChars: z.number().int().min(100).max(32000).default(16000),
    startLine: z.number().int().min(1).max(100000).default(1),
  })
  .strict();
export const guideInput = z
  .object({
    ...pin,
    guideId: z.string().trim().min(1).max(300).default('setup'),
    offset: pageInput.offset,
    maxChars: z.number().int().min(100).max(32000).default(16000),
  })
  .strict();
export const sourceFileSchema = z.object({
  path: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  dependencies: z.array(z.string()),
  externalImports: z.array(z.string()),
});
export const sourceManifestSchema = z.object({
  version: z.literal(1),
  package: z.string(),
  packageVersion: z.string(),
  dependencyVersions: z.record(z.string(), z.string()),
  samples: z.array(
    z.object({
      id: z.string(),
      kind: z.string(),
      package: z.string(),
      title: z.string(),
      description: z.string(),
      source: z.string(),
      api: z.array(z.string()),
      entrypoint: z.string(),
      files: z.array(sourceFileSchema),
      externalImports: z.array(z.string()),
    }),
  ),
});
const metadata = {
  schemaVersion: z.literal(1),
  releaseId: z.string(),
  packageVersion: z.string().nullable(),
  package: z.string().nullable(),
  sourceUrls: z.array(z.string()),
};
const page = { total: z.number().int(), nextOffset: z.number().int().nullable() };
export const summarySchema = z.object({
  id: z.string(),
  kind: z.string(),
  name: z.string(),
  description: z.string(),
  url: z.string(),
});
export const listOutput = z.object({
  ...metadata,
  packages: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
      availableVersions: z.array(z.string()),
    }),
  ),
});
export const searchOutput = z.object({ ...metadata, ...page, results: z.array(summarySchema) });
export const apiOutput = z.object({
  ...metadata,
  ...page,
  record: apiRecordSchema,
  members: z.array(summarySchema),
});
export const exampleOutput = z.object({
  ...metadata,
  ...page,
  id: z.string(),
  title: z.string(),
  entrypoint: z.string(),
  dependencyVersions: z.record(z.string(), z.string()),
  externalImports: z.array(z.string()),
  manifest: z.array(sourceFileSchema),
  files: z.array(
    z.object({
      path: z.string(),
      sha256: z.string(),
      sourceUrl: z.string(),
      content: z.string(),
      startLine: z.number(),
      nextLine: z.number().nullable(),
      truncated: z.boolean(),
    }),
  ),
});
export const guideOutput = z.object({
  ...metadata,
  id: z.string(),
  title: z.string(),
  description: z.string(),
  content: z.string(),
  contentHash: z.string(),
  url: z.string(),
  totalChars: z.number(),
  nextOffset: z.number().nullable(),
});
