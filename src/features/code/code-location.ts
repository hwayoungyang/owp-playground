import { z } from 'zod';

export const codeLocationSchema = z
  .object({
    file: z
      .string()
      .regex(/^playgrounds\/(?:datagrid|charts|core)\/(?:[\w-]+\/)*[\w.-]+\.(?:tsx?|css)$/),
    line: z.number().int().positive().max(100000),
    endLine: z.number().int().positive().max(100000),
  })
  .refine(
    (location) => location.endLine >= location.line && location.endLine - location.line <= 100,
    { message: 'Invalid source line range' },
  );
export type CodeLocation = Readonly<z.infer<typeof codeLocationSchema>>;

export function readCodeLocation(
  query: URLSearchParams,
  packageId: string,
): CodeLocation | undefined {
  const parsed = codeLocationSchema.safeParse({
    file: query.get('file'),
    line: Number(query.get('line')),
    endLine: Number(query.get('endLine') ?? query.get('line')),
  });
  return parsed.success && parsed.data.file.startsWith(`playgrounds/${packageId}/`)
    ? parsed.data
    : undefined;
}

export function exampleCodeHref(
  packageId: string,
  exampleId: string,
  location?: CodeLocation | null,
): string {
  const query = new URLSearchParams({ package: packageId, sample: exampleId, tab: 'code' });
  if (location) {
    query.set('file', location.file);
    query.set('line', String(location.line));
    query.set('endLine', String(location.endLine));
  }
  return `?${query}`;
}
