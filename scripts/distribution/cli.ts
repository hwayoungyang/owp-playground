import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { z } from 'zod';
import { planDistribution } from '../../src/distribution/content.ts';
import { reviewedCapabilities, reviewedDistributionContent } from '../../src/distribution/reviewed-content.ts';
import { readDistributionContext } from './context.ts';
import { DistributionError } from './integrity.ts';

/** 읽기 전용 계획 명령입니다. install·build·자료 생성·이력 갱신을 실행하지 않습니다. */
export function distributionPlanReport(root: string, profileId: string, configFile?: string) {
  const context = readDistributionContext(root, { configFile });
  const profile = context.profiles.find((entry) => entry.id === profileId);
  if (!profile || profile.audience !== 'company')
    throw new DistributionError('company-profile-required', '존재하는 고객 프로필을 지정하세요.');
  const plan = planDistribution({
    items: reviewedDistributionContent,
    requestedItems: reviewedDistributionContent.filter((item) => ['example', 'api'].includes(item.kind)).map((item) => item.id),
    packageIds: profile.packages.map((pkg) => pkg.id), grantedCapabilities: profile.features,
    knownCapabilities: reviewedCapabilities,
  });
  return {
    schemaVersion: 1, profile,
    plan,
    blockers: [
      ...(profile.manifestStatus === 'verified' ? [] : ['manifest-not-verified']),
      ...(profile.runtimeStatus === 'verified' ? [] : ['runtime-not-verified']),
      ...(plan.ready ? [] : ['content-plan-blocked']),
      'isolated-executable-entry-not-prepared',
    ],
    executionReady: false,
  } as const;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  try {
    if (args[0] !== 'plan' || !args[1] || args.length > 3)
      throw new DistributionError('usage', '사용법: node --experimental-strip-types scripts/distribution/cli.ts plan <profileId> [configFile]');
    const profileId = z.string().regex(/^[a-z][a-z0-9_-]*$/).parse(args[1]);
    console.log(JSON.stringify(distributionPlanReport(process.cwd(), profileId, args[2]), null, 2));
  } catch (error) {
    if (error instanceof Error) {
      console.error(JSON.stringify({ code: error instanceof DistributionError ? error.code : 'invalid-input', message: '배포 계획을 읽지 못했습니다. 입력과 로컬 설정을 확인하세요.' }));
      process.exitCode = 1;
    } else throw error;
  }
}
