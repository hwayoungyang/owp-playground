import { z } from 'zod';
import { digestSchema, distributionBuildIdSchema, distributionIdSchema } from '../../src/distribution/schema.ts';
import { DistributionError, objectDigest } from './integrity.ts';

export const historyEventTypes = ['build', 'validation', 'archive-validation', 'delivery', 'install', 'defect', 'replacement', 'rollback'] as const;
const historyReferenceSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/).refine((value) => !value.includes('..'));
const projectReferenceSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/).refine((value) => !value.includes('..'));
const detailsSchema = z.object({
  passed: z.boolean().optional(), deliveryId: historyReferenceSchema.optional(),
  projectId: projectReferenceSchema.optional(), replacesBuildId: distributionBuildIdSchema.optional(),
  deliveryManifestDigest: digestSchema.optional(), archiveDigest: digestSchema.optional(),
}).readonly();

/** Framework 원본 입력 계약입니다. browser DTO와 구분하여 원문은 반환하지 않습니다. */
export const distributionHistoryEventSchema = z.object({
  sequence: z.number().int().positive(), eventType: z.enum(historyEventTypes),
  companyId: distributionIdSchema, timestamp: z.iso.datetime(), policyHash: digestSchema,
  buildId: distributionBuildIdSchema.nullable().default(null),
  packages: z.record(z.string(), z.unknown()).default({}), details: detailsSchema.default({}),
  prevEventHash: digestSchema.nullable(), eventHash: digestSchema,
}).readonly();
export type DistributionHistoryEvent = {
  readonly sequence: number; readonly type: typeof historyEventTypes[number];
  readonly companyId: string; readonly buildId: string | null; readonly timestamp: string;
  readonly prevEventHash: string | null; readonly eventHash: string;
  readonly status: 'confirmed' | 'failed';
  readonly deliveryId?: string; readonly projectId?: string;
};
type Installation = { readonly projectId: string; readonly buildId: string; readonly deliveryId: string };
export type DistributionHistorySummary = {
  readonly companyId: string; readonly chainStatus: 'unknown' | 'verified'; readonly eventCount: number;
  readonly latestBuildId: string | null; readonly installedBuildId: string | null;
  readonly deliveryStatus: 'unknown' | 'confirmed'; readonly installStatus: 'unknown' | 'confirmed';
  readonly installations: readonly Installation[]; readonly events: readonly DistributionHistoryEvent[];
};

/** Framework computeEventHash와 같은 필드 선택·null/default 규칙을 보존합니다. */
export function computeEventHash(core: Readonly<Record<string, unknown>>): string {
  return objectDigest({
    sequence: core.sequence, eventType: core.eventType, companyId: core.companyId,
    timestamp: core.timestamp, policyHash: core.policyHash, buildId: core.buildId ?? null,
    packages: core.packages ?? {}, details: core.details ?? {}, prevEventHash: core.prevEventHash ?? null,
  });
}
export type HistorySourceAdapter = (source: unknown) => readonly Readonly<Record<string, unknown>>[];
type Archive = { readonly passed: boolean; readonly deliveryManifestDigest?: string; readonly archiveDigest?: string };

/** 명시된 이벤트만 읽고 hash와 선행 사실을 검증합니다. 운영 원장이나 아카이브는 열지 않습니다. */
export function readDistributionHistory(
  source: unknown,
  companyId: string,
  adapter: HistorySourceAdapter = (input) => z.array(z.record(z.string(), z.unknown())).parse(input),
): DistributionHistorySummary {
  distributionIdSchema.parse(companyId);
  const rawEvents = source === undefined ? [] : adapter(source);
  const events: DistributionHistoryEvent[] = [];
  const builds = new Map<string, string>();
  const validations = new Map<string, boolean>();
  const archives = new Map<string, Archive>();
  const deliveries = new Map<string, { readonly buildId: string; readonly archive: Archive }>();
  const installations = new Map<string, Installation>();
  const defects = new Set<string>();
  let previous: string | null = null;
  let latestBuildId: string | null = null;
  const deliveryCurrent = (deliveryId: string, buildId: string): boolean => {
    const delivery = deliveries.get(deliveryId);
    const archive = archives.get(`${buildId}:${deliveryId}`);
    return delivery?.buildId === buildId && validations.get(buildId) === true && !defects.has(buildId) &&
      archive?.passed === true && objectDigest(delivery.archive) === objectDigest(archive);
  };
  for (const [index, raw] of rawEvents.entries()) {
    const event = distributionHistoryEventSchema.parse(raw);
    if (event.sequence !== index + 1 || event.companyId !== companyId || event.prevEventHash !== previous ||
      computeEventHash(raw) !== event.eventHash)
      throw new DistributionError('history-chain-invalid', '배포 이력의 순서·고객·hash chain이 맞지 않습니다.');
    previous = event.eventHash;
    const buildId = event.buildId;
    if (!buildId) throw new DistributionError('history-build-required', '해당 이력에는 buildId가 필요합니다.');
    const identity = objectDigest({ policyHash: event.policyHash, packages: event.packages });
    if (event.eventType !== 'build' && builds.get(buildId) !== identity)
      throw new DistributionError('history-build-identity', '등록된 build의 policy·package identity가 필요합니다.');
    const details = event.details;
    switch (event.eventType) {
      case 'build':
        if (builds.has(buildId) && builds.get(buildId) !== identity)
          throw new DistributionError('history-build-identity', '같은 build의 identity가 변경되었습니다.');
        builds.set(buildId, identity); latestBuildId = buildId; break;
      case 'validation':
        if (details.passed === undefined) throw new DistributionError('history-validation-invalid', 'validation.passed가 필요합니다.');
        validations.set(buildId, details.passed); break;
      case 'archive-validation':
        if (details.passed === undefined || !details.deliveryId || (details.passed &&
          (!details.deliveryManifestDigest || !details.archiveDigest || validations.get(buildId) !== true || defects.has(buildId))))
          throw new DistributionError('history-archive-invalid', '아카이브 검증에는 deliveryId·passed와 선행 validation이 필요합니다.');
        archives.set(`${buildId}:${details.deliveryId}`, { passed: details.passed,
          ...(details.deliveryManifestDigest ? { deliveryManifestDigest: details.deliveryManifestDigest } : {}),
          ...(details.archiveDigest ? { archiveDigest: details.archiveDigest } : {}) }); break;
      case 'delivery': {
        const archive = details.deliveryId ? archives.get(`${buildId}:${details.deliveryId}`) : undefined;
        if (!details.deliveryId || archive?.passed !== true || validations.get(buildId) !== true || defects.has(buildId) ||
          archive.deliveryManifestDigest !== details.deliveryManifestDigest || archive.archiveDigest !== details.archiveDigest)
          throw new DistributionError('history-delivery-invalid', 'delivery에는 같은 build·deliveryId의 최신 성공 검증이 필요합니다.');
        const delivered = deliveries.get(details.deliveryId);
        if (delivered && (delivered.buildId !== buildId || delivered.archive.deliveryManifestDigest !== archive.deliveryManifestDigest ||
          delivered.archive.archiveDigest !== archive.archiveDigest))
          throw new DistributionError('history-delivery-identity', '같은 deliveryId의 build·manifest·archive identity는 변경할 수 없습니다.');
        deliveries.set(details.deliveryId, { buildId, archive }); break;
      }
      case 'install': {
        const delivery = details.deliveryId ? deliveries.get(details.deliveryId) : undefined;
        if (!details.deliveryId || !details.projectId || !delivery || !deliveryCurrent(details.deliveryId, buildId) ||
          delivery.archive.deliveryManifestDigest !== details.deliveryManifestDigest || delivery.archive.archiveDigest !== details.archiveDigest)
          throw new DistributionError('history-install-without-delivery', 'install에는 projectId와 같은 build·deliveryId의 유효한 선행 delivery가 필요합니다.');
        // 실패가 기존 설치를 보존했다는 증거도 없으므로 해당 project의 현재 설치는 미확인입니다.
        if (details.passed === false) installations.delete(details.projectId);
        else installations.set(details.projectId, { projectId: details.projectId, buildId, deliveryId: details.deliveryId });
        break;
      }
      case 'defect': defects.add(buildId); break;
      case 'replacement':
        if (validations.get(buildId) !== true || defects.has(buildId) || !details.replacesBuildId ||
          details.replacesBuildId === buildId || !builds.has(details.replacesBuildId))
          throw new DistributionError('history-replacement-invalid', 'replacement에는 검증된 새 build와 다른 기존 build가 필요합니다.');
        for (const [projectId, installation] of installations)
          if (installation.buildId === details.replacesBuildId) installations.delete(projectId);
        break;
      case 'rollback':
        if (!details.deliveryId || !deliveryCurrent(details.deliveryId, buildId))
          throw new DistributionError('history-rollback-invalid', 'rollback에는 유효한 대상 delivery가 필요합니다.');
        installations.clear(); break;
      default: event.eventType satisfies never;
    }
    events.push({ sequence: event.sequence, type: event.eventType, companyId: event.companyId,
      buildId, timestamp: event.timestamp, prevEventHash: event.prevEventHash, eventHash: event.eventHash,
      status: details.passed === false ? 'failed' : 'confirmed',
      ...(details.deliveryId ? { deliveryId: details.deliveryId } : {}),
      ...(details.projectId ? { projectId: details.projectId } : {}) });
  }
  const currentInstalls = [...installations.values()].filter((entry) => deliveryCurrent(entry.deliveryId, entry.buildId));
  const installedBuilds = new Set(currentInstalls.map((entry) => entry.buildId));
  return { companyId, chainStatus: events.length ? 'verified' : 'unknown', eventCount: events.length,
    latestBuildId, installedBuildId: installedBuilds.size === 1 ? currentInstalls[0]?.buildId ?? null : null,
    deliveryStatus: [...deliveries].some(([id, delivery]) => deliveryCurrent(id, delivery.buildId)) ? 'confirmed' : 'unknown',
    installStatus: currentInstalls.length ? 'confirmed' : 'unknown', installations: currentInstalls, events };
}
