import { z } from 'zod';

const packageInput = z
  .string()
  .trim()
  .regex(/^(?:@owp\/)?[a-z][a-z0-9-]*$/)
  .max(80);
const version = z.string().regex(/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?$/);
const releaseId = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/)
  .optional();
const safeKey = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .refine(
    (value) =>
      !/[\\%]/.test(value) &&
      !Array.from(value).some((char) => char.charCodeAt(0) < 32) &&
      !value.split('/').some((segment) => segment === '.' || segment === '..'),
  );
const pin = { package: packageInput, version: version.optional(), releaseId };
export const pageInput = {
  offset: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
  limit: z.number().int().min(1).max(50).default(20),
};
export const listInput = z.strictObject({ releaseId });
export const searchInput = z.strictObject({
  ...pin,
  ...pageInput,
  query: z.string().trim().min(1).max(200),
  kind: z.enum(['api', 'guide', 'example', 'all']).default('all'),
});
export const apiInput = z.strictObject({ ...pin, ...pageInput, symbol: safeKey });
export const guideInput = z.strictObject({
  ...pin,
  guideId: safeKey.default('setup'),
  offset: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).default(0),
  maxChars: z.number().int().min(100).max(32000).default(16000),
});
const sourcePosition = z.strictObject({
  file: safeKey,
  startLine: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  startColumn: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
});
export const exampleInput = z.strictObject({
  ...pin,
  ...pageInput,
  exampleId: z.string().regex(/^[a-zA-Z0-9][\w.-]{0,127}$/),
  file: safeKey.optional(),
  includeDependencies: z.boolean().default(false),
  maxChars: z.number().int().min(100).max(32000).default(16000),
  startLine: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).default(1),
  startColumn: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).default(1),
  pendingStart: sourcePosition.optional(),
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
export const sourceFileSchema = z.object({
  path: z.string(),
  sha256: z.string(),
  dependencies: z.array(z.string()),
  externalImports: z.array(z.string()),
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
  record: z.object({
    id: z.string(),
    package: z.string(),
    packageVersion: z.string(),
    owner: z.string(),
    name: z.string(),
    path: z.string(),
    kind: z.string(),
    imports: z.array(z.string()),
    description: z.string(),
    body: z.string(),
    signature: z.string(),
    requirement: z.string(),
    related: z.array(z.string()),
    guideIds: z.array(z.string()),
    locale: z.string(),
    defaultDescription: z.string().nullable(),
    usageNote: z.string().nullable(),
    typeParameters: z.array(
      z.object({
        name: z.string(),
        constraint: z.string().nullable(),
        default: z.string().nullable(),
      }),
    ),
    typeReferences: z.record(z.string(), z.string()),
    examples: z.array(z.unknown()),
    source: z.object({ path: z.string(), line: z.number(), sha256: z.string() }),
    sources: z.array(z.string()),
    url: z.string(),
    contentHash: z.string(),
  }),
  members: z.array(summarySchema),
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
export const exampleOutput = z.object({
  ...metadata,
  ...page,
  id: z.string(),
  title: z.string(),
  entrypoint: z.string(),
  dependencyVersions: z.record(z.string(), z.string()),
  externalImports: z.array(z.string()),
  manifest: z.array(sourceFileSchema),
  // 같은 pin·includeDependencies를 유지하고 continuation 전체를 다음 요청에 사용합니다.
  continuation: z
    .object({
      file: z.string(),
      startLine: z.number().int().positive(),
      startColumn: z.number().int().positive(),
      offset: z.number().int().nonnegative(),
      pendingStart: sourcePosition.optional(),
    })
    .nullable(),
  files: z.array(
    z.object({
      path: z.string(),
      sha256: z.string(),
      sourceUrl: z.string(),
      content: z.string(),
      startLine: z.number(),
      startColumn: z.number(),
      nextLine: z.number().nullable(),
      nextColumn: z.number().nullable(),
      truncated: z.boolean(),
    }),
  ),
});
