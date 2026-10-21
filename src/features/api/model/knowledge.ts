import { z } from 'zod';
import data from '../data/knowledge.generated.json';
import { codeLocationSchema } from '../../code/code-location';

const recordSchema = z
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

const knowledgeSchema = z.object({
  schemaVersion: z.literal(1),
  packages: z.array(z.object({ id: z.string(), name: z.string(), version: z.string() })),
  dependencies: z.record(z.string(), z.string()),
  records: z.array(recordSchema),
  examples: z.array(
    z.object({ packageId: z.string(), id: z.string(), title: z.string(), source: z.string() }),
  ),
});

export type ApiRecord = z.infer<typeof recordSchema>;
export const knowledge = knowledgeSchema.parse(data);
export const recordsById = new Map(knowledge.records.map((record) => [record.id, record]));

export function packageRecords(packageId: string): readonly ApiRecord[] {
  return knowledge.records.filter(
    (record) =>
      record.package === `@owp/${packageId}` ||
      (packageId === 'charts' && Object.hasOwn(knowledge.dependencies, record.package)),
  );
}
