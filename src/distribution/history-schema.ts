import { z } from 'zod';

const referenceSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/)
  .refine((value) => !value.includes('..'));
export const distributionHistorySummarySchema = z
  .strictObject({
    status: z.enum(['unknown', 'verified', 'missing', 'invalid']),
    deliveryStatus: z.enum(['unknown', 'confirmed']),
    installStatus: z.enum(['unknown', 'confirmed']),
    installations: z
      .array(
        z
          .strictObject({
            projectId: referenceSchema,
            buildId: referenceSchema,
            deliveryId: referenceSchema,
            manifestMatched: z.boolean(),
          })
          .readonly(),
      )
      .readonly(),
    events: z
      .array(
        z
          .strictObject({
            sequence: z.number().int().positive(),
            type: z.enum([
              'build',
              'validation',
              'archive-validation',
              'delivery',
              'install',
              'defect',
              'replacement',
              'rollback',
            ]),
            buildId: referenceSchema.nullable(),
            timestamp: z.iso.datetime(),
            status: z.enum(['confirmed', 'failed']),
            deliveryId: referenceSchema.optional(),
            projectId: referenceSchema.optional(),
          })
          .readonly(),
      )
      .readonly(),
  })
  .readonly();
export type DistributionHistorySummaryDto = z.infer<typeof distributionHistorySummarySchema>;
