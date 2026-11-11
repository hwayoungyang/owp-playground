import { z } from 'zod';
import { distributionCapabilitySchema, distributionIdSchema } from './schema.ts';

export const relativeDistributionPathSchema = z
  .string()
  .refine(
    (value) =>
      value.length > 0 &&
      !value.startsWith('/') &&
      !value.includes('\\') &&
      value
        .split('/')
        .every(
          (part) => part !== '' && part !== '.' && part !== '..' && /^[A-Za-z0-9_@.-]+$/.test(part),
        ),
    '상대 파일 경로가 필요합니다.',
  );
export const contentItemSchema = z
  .strictObject({
    id: z.string().min(1),
    kind: z.enum(['api', 'type', 'guide', 'example', 'source', 'asset', 'execution']),
    packageId: distributionIdSchema,
    classification: z.enum(['reviewed', 'unclassified']),
    requires: z.array(distributionCapabilitySchema).readonly(),
    dependencies: z.array(z.string().min(1)).readonly(),
    files: z.array(relativeDistributionPathSchema).readonly(),
  })
  .readonly();
export type DistributionContentItem = z.infer<typeof contentItemSchema>;
export type DistributionPlanReason = {
  readonly itemId: string;
  readonly code:
    | 'unknown-item'
    | 'unclassified'
    | 'package-excluded'
    | 'capability-missing'
    | 'capability-unknown'
    | 'dependency-excluded'
    | 'dependency-cycle'
    | 'duplicate-item';
  readonly target: string;
};
export type DistributionPlan = {
  readonly includedItems: readonly DistributionContentItem[];
  readonly includedFiles: readonly string[];
  readonly excluded: readonly DistributionPlanReason[];
  readonly unresolved: readonly DistributionPlanReason[];
  readonly ready: boolean;
};

/** Parent capability나 package 허용을 개별 항목의 허용으로 확대하지 않습니다. */
export function planDistribution(input: {
  readonly items: readonly DistributionContentItem[];
  readonly requestedItems: readonly string[];
  readonly packageIds: readonly string[];
  readonly grantedCapabilities: readonly string[];
  readonly knownCapabilities: readonly string[];
}): DistributionPlan {
  const items = new Map<string, DistributionContentItem>();
  const unresolved: DistributionPlanReason[] = [];
  for (const item of input.items) {
    if (items.has(item.id))
      unresolved.push({ itemId: item.id, code: 'duplicate-item', target: item.id });
    items.set(item.id, item);
  }
  const packages = new Set(input.packageIds);
  const granted = new Set(input.grantedCapabilities);
  const known = new Set(input.knownCapabilities);
  const excluded: DistributionPlanReason[] = [];
  const accepted = new Set<string>();
  const rejected = new Set<string>();
  const visiting = new Set<string>();
  function visit(id: string): boolean {
    if (rejected.has(id)) return false;
    if (accepted.has(id)) return true;
    if (visiting.has(id)) {
      unresolved.push({ itemId: id, code: 'dependency-cycle', target: id });
      rejected.add(id);
      return false;
    }
    const item = items.get(id);
    if (!item) {
      unresolved.push({ itemId: id, code: 'unknown-item', target: id });
      rejected.add(id);
      return false;
    }
    let allowed = true;
    if (item.classification !== 'reviewed') {
      unresolved.push({ itemId: id, code: 'unclassified', target: id });
      allowed = false;
    }
    if (!packages.has(item.packageId)) {
      excluded.push({ itemId: id, code: 'package-excluded', target: item.packageId });
      allowed = false;
    }
    if (item.requires.length === 0) {
      unresolved.push({ itemId: id, code: 'unclassified', target: id });
      allowed = false;
    }
    for (const capability of item.requires) {
      if (!known.has(capability)) {
        unresolved.push({ itemId: id, code: 'capability-unknown', target: capability });
        allowed = false;
      } else if (!granted.has(capability)) {
        excluded.push({ itemId: id, code: 'capability-missing', target: capability });
        allowed = false;
      }
    }
    visiting.add(id);
    for (const dependency of item.dependencies)
      if (!visit(dependency)) {
        excluded.push({ itemId: id, code: 'dependency-excluded', target: dependency });
        allowed = false;
      }
    visiting.delete(id);
    if (allowed) accepted.add(id);
    else rejected.add(id);
    return allowed;
  }
  for (const id of input.requestedItems) visit(id);
  // 허용되지 않은 root의 보조 파일은 산출물에 남기지 않습니다.
  const reachable = new Set<string>();
  function collect(id: string) {
    if (reachable.has(id) || !accepted.has(id)) return;
    reachable.add(id);
    for (const dependency of items.get(id)?.dependencies ?? []) collect(dependency);
  }
  for (const id of input.requestedItems) collect(id);
  const includedItems = [...reachable].sort().flatMap((id) => {
    const item = items.get(id);
    return item ? [item] : [];
  });
  return {
    includedItems,
    includedFiles: [...new Set(includedItems.flatMap((item) => item.files))].sort(),
    excluded,
    unresolved,
    ready: excluded.length === 0 && unresolved.length === 0 && input.requestedItems.length > 0,
  };
}
