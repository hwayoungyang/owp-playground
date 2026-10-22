import { z } from 'zod';
import { codeLocationSchema } from '../../code/code-location.ts';
import { apiExampleKey, apiRecordReferenceIds } from './package-data.ts';

export const apiRecordSchema = z
  .object({
    id: z.string(),
    package: z.string(),
    packageVersion: z.string(),
    owner: z.string(),
    name: z.string(),
    path: z.string(),
    kind: z.enum([
      'component',
      'function',
      'constant',
      'type',
      'method',
      'event',
      'property',
      'guide',
    ]),
    imports: z.array(z.string()),
    description: z.string(),
    body: z.string(),
    sections: z.array(z.object({ title: z.string(), body: z.string() })).optional(),
    signature: z.string(),
    requirement: z.enum(['declaration', 'required', 'optional', 'conditional']),
    related: z.array(z.string()),
    guideIds: z.array(z.string()),
    locale: z.string(),
    defaultDescription: z.string().nullable(),
    usageNote: z.string().nullable(),
    documentation: z.string().optional(),
    docTags: z.array(z.object({ name: z.string(), text: z.string() })).optional(),
    defaultNote: z.string().nullable().optional(),
    typeParameters: z
      .array(
        z.object({
          name: z.string(),
          constraint: z.string().nullable(),
          default: z.string().nullable(),
        }),
      )
      .optional(),
    typeReferences: z.record(z.string(), z.string()).optional(),
    typeDetails: z
      .object({
        values: z.array(z.string()),
        valueKind: z.enum(['exact', 'constraint']).nullable(),
        extensible: z.boolean(),
        sources: z.array(z.string()),
        augmentationSources: z.array(
          z.object({ path: z.string(), line: z.number(), sha256: z.string() }),
        ),
      })
      .optional(),
    declaredIn: z.string().optional(),
    inheritedFrom: z.array(z.string()).optional(),
    inheritanceKind: z.enum(['union', 'intersection']).optional(),
    declarationSignature: z.string().optional(),
    typeArguments: z.array(z.string()).optional(),
    examples: z.array(
      z.object({
        packageId: z.string(),
        id: z.string(),
        url: z.string(),
        codeUrl: z.string(),
        location: codeLocationSchema.safeExtend({ sha256: z.string() }).nullable(),
        entrypoint: z.string(),
        sha256: z.string(),
      }),
    ),
    source: z.object({ path: z.string(), line: z.number(), sha256: z.string() }),
    sources: z.array(z.string()),
    url: z.string(),
    contentHash: z.string(),
  })
  .readonly();

export const apiExampleSummarySchema = z.object({
  packageId: z.string(),
  id: z.string(),
  title: z.string(),
  source: z.string(),
});

export const knowledgeSchema = z.object({
  schemaVersion: z.literal(1),
  packages: z.array(z.object({ id: z.string(), name: z.string(), version: z.string() })),
  dependencies: z.record(z.string(), z.string()),
  records: z.array(apiRecordSchema),
  examples: z.array(apiExampleSummarySchema),
});

export const apiPackageIdSchema = z.enum(['datagrid', 'charts']);
export const packageKnowledgeSchema = z.object({
  schemaVersion: z.literal(1),
  id: apiPackageIdSchema,
  name: z.string(),
  version: z.string(),
  dependencies: z.record(z.string(), z.string()),
  records: z.array(apiRecordSchema),
  referenceRecords: z.array(apiRecordSchema),
  examples: z.array(apiExampleSummarySchema),
}).superRefine((data, context) => {
  if (data.name !== `@owp/${data.id}`) {
    context.addIssue({ code: 'custom', message: 'API package identity mismatch' });
  }
  const records = [...data.records, ...data.referenceRecords];
  const ids = new Set(records.map((record) => record.id));
  if (ids.size !== records.length) {
    context.addIssue({ code: 'custom', message: 'Duplicate API record ID' });
  }
  for (const record of data.records) {
    if (record.package !== data.name &&
      !(data.id === 'charts' && Object.hasOwn(data.dependencies, record.package))) {
      context.addIssue({ code: 'custom', message: `Unexpected searchable API: ${record.id}` });
    }
  }
  const examples = new Set(data.examples.map(apiExampleKey));
  for (const record of records) {
    for (const id of apiRecordReferenceIds(record)) {
      if (!ids.has(id)) context.addIssue({ code: 'custom', message: `Missing API: ${record.id}/${id}` });
    }
    for (const example of record.examples) {
      if (!examples.has(apiExampleKey(example))) {
        context.addIssue({ code: 'custom', message: `Missing example: ${record.id}/${apiExampleKey(example)}` });
      }
    }
  }
});

export type ApiRecord = z.infer<typeof apiRecordSchema>;
export type ApiExampleSummary = z.infer<typeof apiExampleSummarySchema>;
export type ApiPackageId = z.infer<typeof apiPackageIdSchema>;
export type PackageKnowledge = z.infer<typeof packageKnowledgeSchema>;
