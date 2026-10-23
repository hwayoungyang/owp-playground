import { z } from 'zod';

export const releaseIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/);
export const releasePackageIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
export const exactPackageVersionSchema = z
  .string()
  .regex(
    /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
  );
export const archiveRelativePathSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      /^[A-Za-z0-9_./@+-]+$/.test(value) &&
      !value.startsWith('/') &&
      value.split('/').every((part) => part !== '' && part !== '.' && part !== '..'),
    '안전한 아카이브 상대 경로가 필요합니다.',
  );
export const releaseChannelSchema = z.enum(['draft', 'stable']);
export const releasePackageSchema = z
  .object({
    id: releasePackageIdSchema,
    name: z.string().regex(/^@owp\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
    version: exactPackageVersionSchema,
  })
  .strict()
  .refine((entry) => entry.name === `@owp/${entry.id}`, '패키지 ID와 이름이 다릅니다.')
  .readonly();

const releasePackagesSchema = z
  .array(releasePackageSchema)
  .min(1)
  .superRefine((entries, context) => {
    if (new Set(entries.map((entry) => entry.id)).size !== entries.length) {
      context.addIssue({ code: 'custom', message: '패키지 ID가 중복됩니다.' });
    }
  })
  .readonly();
const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);
const createdAtSchema = z.iso.datetime();
const basePathSchema = z.string();

export const releaseIndexEntrySchema = z
  .object({
    releaseId: releaseIdSchema,
    createdAt: createdAtSchema,
    basePath: basePathSchema,
    packages: releasePackagesSchema,
    manifestSha256: sha256Schema,
    channel: releaseChannelSchema,
  })
  .strict()
  .refine(
    (entry) => entry.basePath === `/versions/${entry.releaseId}/`,
    '릴리스 basePath가 다릅니다.',
  )
  .readonly();

export const releaseIndexSchema = z
  .object({
    schemaVersion: z.literal(1),
    latestReleaseId: releaseIdSchema,
    releases: z.array(releaseIndexEntrySchema).min(1).readonly(),
  })
  .strict()
  .superRefine((index, context) => {
    const ids = new Set(index.releases.map((entry) => entry.releaseId));
    if (ids.size !== index.releases.length || !ids.has(index.latestReleaseId)) {
      context.addIssue({
        code: 'custom',
        message: '릴리스 ID 또는 latest 포인터가 올바르지 않습니다.',
      });
    }
  })
  .readonly();

export const releaseFileSchema = z
  .object({
    bytes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    sha256: sha256Schema,
  })
  .strict()
  .readonly();

const releaseFilesSchema = z.preprocess(
  (input) =>
    typeof input === 'object' && input !== null && !Array.isArray(input)
      ? Object.entries(input)
      : null,
  z
    .array(z.tuple([archiveRelativePathSchema, releaseFileSchema]))
    .transform((entries) => Object.fromEntries(entries))
    .readonly(),
);

export const knowledgeReleaseSchema = z
  .object({
    schemaVersion: z.literal(1),
    releaseId: releaseIdSchema,
    createdAt: createdAtSchema,
    appVersion: exactPackageVersionSchema,
    commit: z.string().regex(/^[0-9a-f]{7,40}$/),
    dirty: z.boolean(),
    channel: releaseChannelSchema,
    basePath: basePathSchema,
    packages: releasePackagesSchema,
    files: releaseFilesSchema,
  })
  .strict()
  .superRefine((release, context) => {
    if (release.basePath !== `/versions/${release.releaseId}/`) {
      context.addIssue({ code: 'custom', message: '릴리스 basePath가 다릅니다.' });
    }
    if (release.channel === 'stable' && release.dirty) {
      context.addIssue({ code: 'custom', message: 'stable 릴리스는 clean Git tree가 필요합니다.' });
    }
    if (Object.hasOwn(release.files, 'knowledge-release.json')) {
      context.addIssue({ code: 'custom', message: 'manifest 자체는 files에서 제외해야 합니다.' });
    }
  })
  .readonly();

export type ReleasePackage = z.infer<typeof releasePackageSchema>;
export type ReleaseChannel = z.infer<typeof releaseChannelSchema>;
export type ReleaseIndexEntry = z.infer<typeof releaseIndexEntrySchema>;
export type ReleaseIndex = z.infer<typeof releaseIndexSchema>;
export type KnowledgeRelease = z.infer<typeof knowledgeReleaseSchema>;
export type ReleaseFile = z.infer<typeof releaseFileSchema>;
