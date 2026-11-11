import { z } from 'zod';
import { relativeDistributionPathSchema } from '../../src/distribution/content.ts';
import { digestSchema } from '../../src/distribution/schema.ts';
import type { DistributionHistorySummaryDto } from '../../src/distribution/history-schema.ts';
import { readSafeFile } from './files.ts';
import { readDistributionHistory } from './history.ts';
import { DistributionError, objectDigest, providedPackageSchema, sha256 } from './integrity.ts';
import type { ProvidedManifest } from './integrity.ts';

export const historyInputSchema = z
  .strictObject({
    path: relativeDistributionPathSchema.refine((path) => path.endsWith('.jsonl')),
    sha256: digestSchema,
  })
  .readonly();

// raw build 요약과 소비용 manifest의 공통 identity만 비교하며 추가 metadata는 제거합니다.
const historyPackageIdentitySchema = z.record(
  z.string(),
  providedPackageSchema
    .unwrap()
    .pick({
      packageName: true,
      version: true,
      artifactDigest: true,
    })
    .strip(),
);

function unconfirmed(
  status: DistributionHistorySummaryDto['status'],
): DistributionHistorySummaryDto {
  return {
    status,
    deliveryStatus: 'unknown',
    installStatus: 'unknown',
    installations: [],
    events: [],
  };
}

/** 설정에서 명시한 완결된 JSONL만 읽고 browser에 필요한 필드만 선택합니다. */
export function readHistoryContext(
  root: string,
  companyId: string,
  input: z.infer<typeof historyInputSchema> | undefined,
  registeredManifests: readonly ProvidedManifest[] = [],
): DistributionHistorySummaryDto {
  if (!input) return unconfirmed('unknown');
  try {
    const bytes = readSafeFile(root, input.path);
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (sha256(bytes) !== input.sha256 || !text.endsWith('\n'))
      throw new DistributionError(
        'history-file-invalid',
        '이력 파일의 digest 또는 JSONL 끝을 확인하세요.',
      );
    const lines = text.slice(0, -1).split('\n');
    if (lines.some((line) => !line.trim()))
      throw new DistributionError('history-file-invalid', '완결된 JSONL 이벤트가 필요합니다.');
    const source = z
      .array(z.record(z.string(), z.unknown()))
      .parse(lines.map((line) => JSON.parse(line)));
    const result = readDistributionHistory(source, companyId);
    return {
      status: result.chainStatus,
      deliveryStatus: result.deliveryStatus,
      installStatus: result.installStatus,
      installations: result.installations.map(({ projectId, buildId, deliveryId }) => ({
        projectId,
        buildId,
        deliveryId,
        manifestMatched: registeredManifests.some(
          (manifest) =>
            manifest.companyId === companyId &&
            manifest.buildId === buildId &&
            source.some((event) => {
              if (
                event.eventType !== 'build' ||
                event.buildId !== buildId ||
                event.policyHash !== manifest.policyHash
              )
                return false;
              const rawPackages = event.packages;
              if (
                rawPackages === null ||
                typeof rawPackages !== 'object' ||
                Array.isArray(rawPackages)
              )
                return false;
              const ids = Object.keys(manifest.packages);
              // schema가 특수 key를 생략하더라도 원문의 package 집합을 줄여 비교하지 않습니다.
              if (
                Object.keys(rawPackages).length !== ids.length ||
                ids.some((id) => !Object.hasOwn(rawPackages, id))
              )
                return false;
              const packages = historyPackageIdentitySchema.safeParse(rawPackages);
              return (
                packages.success &&
                objectDigest(packages.data) ===
                  objectDigest(historyPackageIdentitySchema.parse(manifest.packages))
              );
            }),
        ),
      })),
      events: result.events.map(
        ({ sequence, type, buildId, timestamp, status, deliveryId, projectId }) => ({
          sequence,
          type,
          buildId,
          timestamp,
          status,
          ...(deliveryId ? { deliveryId } : {}),
          ...(projectId ? { projectId } : {}),
        }),
      ),
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return unconfirmed('missing');
    if (
      error instanceof DistributionError ||
      error instanceof z.ZodError ||
      error instanceof SyntaxError ||
      (error instanceof TypeError &&
        'code' in error &&
        error.code === 'ERR_ENCODING_INVALID_ENCODED_DATA')
    )
      return unconfirmed('invalid');
    throw error;
  }
}
